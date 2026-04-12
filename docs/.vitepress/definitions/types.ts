import type { DefaultTheme } from "vitepress";

/**
 * サーバーとクライアント間でやり取りされるメモデータのインターフェース
 */
export interface MemoData {
    title: string;
    tags: string[];
    content: string;
    date: string;
    fileName: string;
}

/** サイドバーの表示モード */
export type MemoSidebarMode = "tag" | "date";

/** サイドバーの各項目（記事やグループ）の型 */
export type MemoSidebarItem = DefaultTheme.SidebarItem & {
    date?: string;
    tags?: string[];
};

/** サイドバーのグループ定義 */
export interface MemoSidebarGroup {
    mode: MemoSidebarMode;
    label: string;
    items: MemoSidebarItem[];
}

/** build-time loader (sidebar.data.ts) から渡される動的データの型 */
export interface MemoSidebarData {
    groups: MemoSidebarGroup[];
}

/**
 * themeConfig.sidebar に渡すカスタム設定の型
 * 標準の SidebarItem 配列をベースとする
 */
export interface CustomThemeConfig extends DefaultTheme.Config {
    sidebar: MemoSidebarItem[];
}