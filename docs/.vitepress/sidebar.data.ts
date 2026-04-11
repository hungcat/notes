import { createContentLoader } from "vitepress";
import type { DefaultTheme } from "vitepress";

export type MemoSidebarMode = "tag" | "date";

export type MemoSidebarGroup = {
    mode: MemoSidebarMode;
    label: string;
    items: DefaultTheme.SidebarItem[];
};

export type MemoSidebarData = {
    groups: MemoSidebarGroup[];
};

const normalizeTag = (tags: any): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string") {
        return tags.split(",").map(t => t.replace(/^#/, "").trim()).filter(Boolean);
    }
    return [];
};

declare const data: MemoSidebarData;
export { data };

export default createContentLoader("memo/*.md", {
    transform(raw): MemoSidebarData {
        const dateGroups = new Map<string, DefaultTheme.SidebarItem[]>();
        const tagGroups = new Map<string, DefaultTheme.SidebarItem[]>();

        const sorted = raw
            .filter((page) => {
                const path = page.url.replace(/\/$/, "");
                return !path.endsWith("/index") &&
                    !path.endsWith("/index.html") &&
                    !path.endsWith("/getting-started") &&
                    !path.endsWith("/getting-started.html");
            })
            .sort((a, b) => {
                const dateA = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0;
                const dateB = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0;
                // 日付の降順（新しい記事が上）
                if (dateA !== dateB) return dateB - dateA;
                return b.url.localeCompare(a.url);
            });

        sorted.forEach((page) => {
            const { url, frontmatter } = page;
            const title = frontmatter.title || url.split('/').filter(Boolean).pop()?.replace('.html', '') || url;
            const link = url.replace(/\.html$/, "");
            const item: DefaultTheme.SidebarItem = { text: title, link };

            // 日付グループ (YYYY-MM)
            const dateKey = frontmatter.date
                ? new Date(frontmatter.date).toISOString().slice(0, 7)
                : "その他";
            dateGroups.set(dateKey, [...(dateGroups.get(dateKey) ?? []), item]);

            // タググループ
            const tags = normalizeTag(frontmatter.tags);
            if (tags.length === 0) {
                tagGroups.set("その他", [...(tagGroups.get("その他") ?? []), item]);
            } else {
                tags.forEach(tag => {
                    tagGroups.set(tag, [...(tagGroups.get(tag) ?? []), item]);
                });
            }
        });

        return {
            groups: [
                {
                    mode: "tag",
                    label: "タグ表示",
                    items: Array.from(tagGroups.entries())
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([tag, items]) => ({
                            text: tag === "その他" ? "その他" : `タグ: ${tag}`,
                            items,
                        })),
                },
                {
                    mode: "date",
                    label: "日付表示",
                    items: Array.from(dateGroups.entries())
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([month, items]) => ({ text: month, items })),
                },
            ],
        };
    },
});
