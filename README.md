# notes

個人用メモ（[VitePress](https://vitepress.dev/)）。

## 開発

```bash
npm install
npm run docs:dev
```

## 公開 URL

GitHub Pages 有効化後: [HungCat Notes](https://hungcat.github.io/notes/)

## デプロイ

`main`（または `master`）へ push すると [GitHub Actions](.github/workflows/deploy.yml) がビルドして同一リポジトリの GitHub Pages にデプロイします。

リポジトリの **Settings → Pages → Build and deployment** で **Source: GitHub Actions** を選んでください。
