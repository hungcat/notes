import { defineConfigWithTheme } from "vitepress";
import { localRepoWritePlugin } from "./util/localRepoWritePlugin";
import { isDevMode } from "./util/env";
import type { CustomThemeConfig, MemoSidebarItem } from "./definitions/types";
import { getMemoSidebar } from "./util/getMemoSidebar";

export default defineConfigWithTheme<CustomThemeConfig>({
  title: "Notes",
  description: "個人用メモ",
  base: "/notes/",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "ホーム", link: "/" },
      ...(isDevMode ? [{ text: "メモ入力", link: "/input" }] : []),
    ],
    sidebar: [
      { text: "はじめに", link: "/getting-started" },
      ...getMemoSidebar()
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/hungcat/notes" }],
    search: { provider: "local" },
  },
  vite: {
    plugins: [localRepoWritePlugin()],
    build: {
      // 警告のしきい値を 500kB から 1000kB (1MB) に引き上げ
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 巨大なライブラリを個別に分割
              // markdown-itは分割するとビルド時エラーが発生するため、分割しない
              if (id.includes('highlight.js')) return 'vendor-highlight';
              if (id.includes('minisearch')) return 'vendor-search';
              if (id.includes('marked')) return 'vendor-marked';
            }
          }
        }
      }
    }
  },
});