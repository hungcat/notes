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
          // 巨大な依存ライブラリを個別のチャンクに分割
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('highlight.js')) {
                return 'vendor-highlight';
              }
              if (id.includes('markdown-it')) {
                return 'vendor-markdown';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  },
});