import path from "path";
import type { IncomingMessage, ServerResponse } from "http";
import { createMarkdownNoteFile, stageCommitPushNoteFile } from "./repoWriteUtils";

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

                        const relativePath = await createMarkdownNoteFile({
                            title,
                            content,
                            fileName,
                        });

                        const commit = commitMessage || `Add note: ${title}`;
                        await stageCommitPushNoteFile(relativePath, commit);

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