import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { IncomingMessage, ServerResponse } from "http";

const execAsync = promisify(exec);

type MiddlewareNext = (err?: unknown) => void;

type ViteServer = {
    middlewares: {
        use: (handler: (req: IncomingMessage, res: ServerResponse, next: MiddlewareNext) => void) => void;
    };
};

/**
 * Vite plugin for handling local repository writes during development.
 * Creates a POST endpoint at /__api/save-note that saves markdown files to the repo.
 */
export const localRepoWritePlugin = () => {
    return {
        name: "vitepress-local-repo-write",
        configureServer(server: ViteServer) {
            server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: MiddlewareNext) => {
                if ((req.url ?? "") !== "/__api/save-note" || req.method !== "POST") {
                    return next();
                }

                let body = "";
                req.on("data", (chunk: Buffer | string) => {
                    body += chunk;
                });
                req.on("end", async () => {
                    res.setHeader("Content-Type", "application/json");
                    try {
                        const data = JSON.parse(body);
                        const { title, content, fileName, commitMessage } = data;
                        if (!title || !content) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: "title and content are required" }));
                            return;
                        }

                        const date = new Date().toISOString().slice(0, 10);
                        const slug = title
                            .toLowerCase()
                            .replace(/[\W_]+/g, "-")
                            .replace(/(^-|-$)/g, "")
                            .slice(0, 50) || "note";
                        const fileBase = fileName
                            ? fileName.replace(/[^\w.-]+/g, "-")
                            : `${date}-${slug}`;

                        let targetPath = path.resolve(process.cwd(), "docs", "memo", `${fileBase}.md`);
                        let counter = 1;
                        while (true) {
                            try {
                                await fs.access(targetPath);
                                targetPath = path.resolve(
                                    process.cwd(),
                                    "docs",
                                    "memo",
                                    `${fileBase}-${counter}.md`
                                );
                                counter += 1;
                            } catch {
                                break;
                            }
                        }

                        const frontmatterTags = (content.match(/#\w+/g) || []).join(", ");
                        const noteBody = `---\ntitle: ${title}\ndate: ${date}\n${frontmatterTags ? `tags: ${frontmatterTags}\n` : ""}---\n\n${content}\n`;

                        await fs.writeFile(targetPath, noteBody, "utf-8");
                        const relativePath = path.relative(process.cwd(), targetPath).replace(/\\/g, "/");
                        const commit = commitMessage || `Add note: ${title}`;
                        await execAsync(`git add "${relativePath}"`);
                        await execAsync(`git commit -m "${commit}"`);
                        await execAsync(`git push`);

                        res.statusCode = 200;
                        res.end(JSON.stringify({ path: relativePath }));
                    } catch (error: unknown) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: String(error) }));
                    }
                });
            });
        },
    };
};