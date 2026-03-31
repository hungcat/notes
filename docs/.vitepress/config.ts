import { defineConfig } from "vitepress";

// GitHub Pages: https://<user>.github.io/<repo>/
export default defineConfig({
  title: "Notes",
  description: "個人用メモ",
  base: "/notes/",
  themeConfig: {
    nav: [{ text: "ホーム", link: "/" }],
    sidebar: [
      {
        text: "メモ",
        items: [{ text: "はじめに", link: "/memo/getting-started" }],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/hungcat/notes" }],
    search: { provider: "local" },
  },
});
