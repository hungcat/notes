import fs from 'node:fs';
import path from 'node:path';
import type { MemoSidebarItem } from "../definitions/types";

/**
 * memo フォルダ内のファイルをスキャンし、日付順にソートされたサイドバー項目を返す
 * config.ts (Node.js) から直接呼び出し可能
 */
export function getMemoSidebar(): MemoSidebarItem[] {
    const memoDir = path.resolve(process.cwd(), 'docs/memo');
    if (!fs.existsSync(memoDir)) return [];

    const memos = fs.readdirSync(memoDir)
        .filter(file => file.endsWith('.md'))
        .map(file => {
            const fullPath = path.join(memoDir, file);
            const content = fs.readFileSync(fullPath, 'utf-8');

            // フロントマターから柔軟に抽出
            const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m);
            const dateMatch = content.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?$/m);
            const tagsMatch = content.match(/^tags:\s*(.+)$/m);
            const rawTags = tagsMatch ? tagsMatch[1].replace(/[\[\]]/g, '') : '';

            return {
                text: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''),
                link: `/memo/${file.replace('.md', '')}`,
                date: dateMatch ? dateMatch[1] : undefined,
                tags: rawTags ? rawTags.split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean) : []
            };
        });

    return memos.sort((a, b) => (b.date || '0000-00-00').localeCompare(a.date || '0000-00-00'));
}
