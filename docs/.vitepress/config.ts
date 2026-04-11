import { defineConfig } from "vitepress";
import type { DefaultTheme } from "vitepress";
import { localRepoWritePlugin } from "./util/localRepoWritePlugin";
import { isDevMode } from "./util/env";

const navItems: DefaultTheme.NavItem[] = [
  { text: "ホーム", link: "/" },
  ...(isDevMode ? [{ text: "メモ入力", link: "/input" }] : []),
];

export default defineConfig({
  title: "Notes",
  description: "個人用メモ",
  base: "/notes/",
  cleanUrls: true,
  themeConfig: {
    nav: navItems,
    sidebar: [
      {
        text: "メモ",
        items: [{ text: "はじめに", link: "/memo/getting-started" }],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/hungcat/notes" }],
    search: { provider: "local" },
  },
  vite: {
    plugins: [localRepoWritePlugin()],
  },
});
