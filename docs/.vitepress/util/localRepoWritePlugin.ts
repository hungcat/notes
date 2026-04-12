import path from "path";
import type { IncomingMessage, ServerResponse } from "http";
import { createMarkdownNoteFile, stageCommitPushNoteFile } from "./repoWriteUtils";
import type { MemoData } from "../definitions/types";

type MiddlewareNext = (err?: unknown) => void;

type ViteServer = {
    middlewares: {
        use: (handler: (req: IncomingMessage, res: ServerResponse, next: MiddlewareNext) => void) => void;
    };
};

/**
 * Vite plugin for handling local repository writes during development.
 * 開発サーバー起動時に、ファイルの保存とGit操作を行うエンドポイントを提供します。
 * 
 * @returns {object} Viteプラグインオブジェクト
 */
export const localRepoWritePlugin = () => {
    return {
        name: "vitepress-local-repo-write",
        configureServer(server: ViteServer) {
            server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: MiddlewareNext) => {
                const url = req.url ?? "";
                if (req.method !== "POST" || (url !== "/api/save-note" && url !== "/api/push-note")) {
                    return next();
                }

                // POSTボディの読み込み
                let body = "";
                req.on("data", (chunk: Buffer | string) => {
                    body += chunk;
                });
                req.on("end", async () => {
                    res.setHeader("Content-Type", "application/json");
                    try {
                        const data = JSON.parse(body);

                        // ファイル保存API
                        if (url === "/api/save-note") {
                            const memo: MemoData = data;
                            if (!memo.title || !memo.content) {
                                res.statusCode = 400;
                                res.end(JSON.stringify({ error: "title and content are required" }));
                                return;
                            }

                            const relativePath = await createMarkdownNoteFile({
                                title: memo.title,
                                content: memo.content,
                                tags: memo.tags,
                                date: memo.date,
                                fileName: memo.fileName,
                            });
                            res.statusCode = 200;
                            res.end(JSON.stringify({ path: relativePath }));
                            // Git操作API
                        } else if (url === "/api/push-note") {
                            const { path: relativePath, commitMessage } = data;
                            if (!relativePath) {
                                res.statusCode = 400;
                                res.end(JSON.stringify({ error: "path is required for git push" }));
                                return;
                            }
                            await stageCommitPushNoteFile(relativePath, commitMessage);
                            res.statusCode = 200;
                            res.end(JSON.stringify({ success: true }));
                        }
                    } catch (error: unknown) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: String(error) }));
                    }
                });
            });
        },
    };
};