import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Configuration interface for externalization
export interface NoteRepositoryConfig {
    baseDir: string;
    memoDir: string;
    dateFormat: string;
    fileExtension: string;
    gitRemote?: string;
    gitBranch?: string;
}

// File system abstraction for easier testing and externalization
export interface FileSystemAdapter {
    mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void>;
    access(filePath: string): Promise<void>;
    writeFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<void>;
}

// Git operations abstraction for externalization (e.g., GitHub API)
export interface GitAdapter {
    add(files: string[]): Promise<void>;
    commit(message: string): Promise<void>;
    push(remote?: string, branch?: string): Promise<void>;
}

// Default implementations
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

class DefaultGitAdapter implements GitAdapter {
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

// Default configuration
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

const formatSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^\w-]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 50) || "note";

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

const getMemoDirectory = (config: NoteRepositoryConfig) => path.resolve(config.baseDir, config.memoDir);

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
    const slug = formatSlug(title);
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

export const stageCommitPushNoteFile = async (
    relativePath: string,
    commitMessage?: string,
    config: Partial<NoteRepositoryConfig> = defaultConfig,
    gitAdapter: GitAdapter = new DefaultGitAdapter()
) => {
    const mergedConfig = { ...defaultConfig, ...config };
    const normalizedCommitMessage = commitMessage ?? `Add note: ${relativePath}`;

    await gitAdapter.add([relativePath]);
    await gitAdapter.commit(normalizedCommitMessage);
    await gitAdapter.push(mergedConfig.gitRemote, mergedConfig.gitBranch);
};
