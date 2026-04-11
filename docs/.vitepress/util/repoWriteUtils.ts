import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { slugify } from "./slugify";

const execAsync = promisify(exec);

/**
 * ノートリポジトリの動作を定義する設定インターフェース
 */
export interface NoteRepositoryConfig {
    baseDir: string;
    memoDir: string;
    dateFormat: string;
    fileExtension: string;
    gitRemote?: string;
    gitBranch?: string;
}

/**
 * ファイル操作を抽象化するインターフェース（テストや外部ストレージ対応を容易にするため）
 */
export interface FileSystemAdapter {
    mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void>;
    access(filePath: string): Promise<void>;
    writeFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<void>;
}

/**
 * Git操作を抽象化するインターフェース
 */
export interface GitAdapter {
    reset(): Promise<void>;
    add(files: string[]): Promise<void>;
    commit(message: string): Promise<void>;
    push(remote?: string, branch?: string): Promise<void>;
}

/**
 * Node.js の標準 fs モジュールを使用したデフォルトのファイルシステム実装
 */
class DefaultFileSystemAdapter implements FileSystemAdapter {
    async mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
        await fs.mkdir(dirPath, options);
    }
    async access(filePath: string): Promise<void> {
        await fs.access(filePath);
    }
    async writeFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<void> {
        await fs.writeFile(filePath, content, encoding);
    }
}

/**
 * ローカルの git コマンドを使用したデフォルトの Git 操作実装
 */
class DefaultGitAdapter implements GitAdapter {
    async reset(): Promise<void> {
        await execAsync(`git reset`);
    }
    async add(files: string[]): Promise<void> {
        for (const file of files) {
            await execAsync(`git add "${file}"`);
        }
    }
    async commit(message: string): Promise<void> {
        await execAsync(`git commit -m "${message}"`);
    }
    async push(remote?: string, branch?: string): Promise<void> {
        const remoteArg = remote ? ` ${remote}` : "";
        const branchArg = branch ? ` ${branch}` : "";
        await execAsync(`git push${remoteArg}${branchArg}`);
    }
}

/**
 * プロジェクトのデフォルト設定
 */
const defaultConfig: NoteRepositoryConfig = {
    baseDir: process.cwd(),
    memoDir: "docs/memo",
    dateFormat: "YYYY-MM-DD",
    fileExtension: ".md",
    gitRemote: "origin",
    gitBranch: "main",
};

type CreateNoteParams = {
    title: string;
    content: string;
    tags?: string[];
    date?: string;
    fileName?: string;
    config?: Partial<NoteRepositoryConfig>;
    fsAdapter?: FileSystemAdapter;
    gitAdapter?: GitAdapter;
};

/**
 * Markdownファイルの本文（フロントマター付き）を構築する
 * 
 * @param {string} title - ノートのタイトル
 * @param {string} date - 作成日付 (YYYY-MM-DD形式)
 * @param {string} content - Markdownの本文
 * @param {string[]} [tags=[]] - ノートに付与するタグの配列
 * @returns {string} フロントマターを含むMarkdown文字列
 */
const buildNoteBody = (title: string, date: string, content: string, tags: string[] = []) => {
    const frontmatter = [
        "---",
        `title: ${JSON.stringify(title)}`,
        `date: ${date}`,
        tags.length > 0 ? `tags: ${tags.join(", ")}` : null,
        "---"
    ].filter(Boolean).join("\n");

    return `${frontmatter}\n\n${content}\n`;
};

/**
 * メモを保存するディレクトリの絶対パスを取得する
 * 
 * @param {NoteRepositoryConfig} config - リポジトリ設定
 * @returns {string} メモディレクトリの絶対パス
 */
const getMemoDirectory = (config: NoteRepositoryConfig): string => path.resolve(config.baseDir, config.memoDir);

/**
 * 同名ファイルが存在する場合に連番を付与して、ユニークなファイルパスを生成する
 * 
 * @param {string} baseFileName - 拡張子なしのベースファイル名
 * @param {NoteRepositoryConfig} config - リポジトリ設定
 * @param {FileSystemAdapter} fsAdapter - ファイルシステムアダプタの実装
 * @returns {Promise<string>} 生成された一意なファイルパス
 */
const createUniqueNotePath = async (baseFileName: string, config: NoteRepositoryConfig, fsAdapter: FileSystemAdapter) => {
    const memoDir = getMemoDirectory(config);
    await fsAdapter.mkdir(memoDir, { recursive: true });

    let targetPath = path.resolve(memoDir, `${baseFileName}${config.fileExtension}`);
    let counter = 1;

    while (true) {
        try {
            await fsAdapter.access(targetPath);
            targetPath = path.resolve(memoDir, `${baseFileName}-${counter}${config.fileExtension}`);
            counter += 1;
        } catch {
            break;
        }
    }

    return targetPath;
};

/**
 * 新しいMarkdownノートファイルを生成して保存する
 * 
 * @param {CreateNoteParams} params - 作成するノートのパラメータ
 * @returns {Promise<string>} 生成されたファイルのリポジトリルートからの相対パス
 */
export const createMarkdownNoteFile = async ({
    title,
    content,
    tags = [],
    date: providedDate,
    fileName,
    config = defaultConfig,
    fsAdapter = new DefaultFileSystemAdapter()
}: CreateNoteParams) => {
    const mergedConfig = { ...defaultConfig, ...config };
    const date = providedDate || new Date().toISOString().slice(0, 10);
    const slug = slugify(title);
    const baseName = fileName
        ? fileName
            .trim()
            .replace(/[^\p{L}\p{N}_.-]+/gu, "-")
            .replace(/(^-|-$)/g, "") || `${date}-${slug}`
        : `${date}-${slug}`;

    const noteBody = buildNoteBody(title, date, content, tags);
    const targetPath = await createUniqueNotePath(baseName, mergedConfig, fsAdapter);
    await fsAdapter.writeFile(targetPath, noteBody, "utf-8");

    return path.relative(mergedConfig.baseDir, targetPath).replace(/\\/g, "/");
};

/**
 * 指定されたファイルをステージング、コミットし、リモートへプッシュする
 * 
 * @param {string} relativePath - 処理対象ファイルの相対パス
 * @param {string} [commitMessage] - コミットメッセージ
 * @param {Partial<NoteRepositoryConfig>} [config=defaultConfig] - リポジトリ設定
 * @param {GitAdapter} [gitAdapter=new DefaultGitAdapter()] - Git操作アダプタの実装
 * @returns {Promise<void>}
 */
export const stageCommitPushNoteFile = async (
    relativePath: string,
    commitMessage?: string,
    config: Partial<NoteRepositoryConfig> = defaultConfig,
    gitAdapter: GitAdapter = new DefaultGitAdapter()
) => {
    const mergedConfig = { ...defaultConfig, ...config };
    const normalizedCommitMessage = commitMessage ?? `Add note: ${relativePath}`;

    await gitAdapter.reset();
    await gitAdapter.add([relativePath]);
    await gitAdapter.commit(normalizedCommitMessage);
    await gitAdapter.push(mergedConfig.gitRemote, mergedConfig.gitBranch);
};
