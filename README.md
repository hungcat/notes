# HungCat Notes

VitePress をベースとした、個人用のナレッジマネジメントシステムです。
単なる静的サイトとしての閲覧機能だけでなく、ブラウザ上での執筆、ローカル保存、Git 連携（Commit & Push）を統合したエディタ環境を備えています。

## 🚀 主な機能

- **モダンな閲覧体験**: VitePress による高速な静的サイト生成と検索機能。
- **専用メモエディタ**: Vue 3 で構築されたリッチな執筆画面。
- **リアルタイムプレビュー**: `markdown-it` と `highlight.js` による、本番環境と同じ表示でのプレビュー。
- **Local-First 保存**: Vite のミドルウェアを活用した独自 API により、ブラウザからローカルの `.md` ファイルを直接生成。
- **Git 統合**: コミットメッセージの自動生成、特定のファイルのみを対象としたアトミックな Commit & Push 機能。
- **動的サイドバー**: 日付（年月）およびタグ（フロントマター）に基づいた自動グルーピング機能。
- **執筆データの保護**: `localStorage` への自動キャッシュと、未保存時の離脱防止警告。

## 📝 メモ入力画面の使用方法

開発モード（`docs:dev`）で起動中、ナビゲーションメニューの「メモ入力」からアクセスできます（`/input`）。

1. **メタデータ入力**: タイトルとタグ（カンマ区切り）を入力します。タイトルに基づいてファイル名が自動生成（スラグ化）されます。
2. **Markdown 執筆**: 左側のエディタで内容を入力します。右側に即座にプレビューが表示されます。
3. **下書き保存**: 「1. 下書き保存」ボタンを押すと、ローカルの `docs/memo/` ディレクトリに `.md` ファイルが生成されます。
4. **Git Push**: 「2. コミット & Push」ボタンを押すと、保存されたファイルだけをステージングし、GitHub 等のリモートリポジトリへ Push します。

> [!TIP]
> 執筆中にブラウザをリロードしても、内容は `localStorage` から自動的に復元されます。

## 🛠 技術スタック

- **SSG**: VitePress
- **Frontend**: Vue 3 (Composition API), TypeScript
- **Backend (Dev)**: Vite Custom Plugin (Connect Middleware)
- **Markdown Engine**: markdown-it, highlight.js
- **Package Manager**: pnpm

## 📂 ディレクトリ構造

```text
.
├── docs/
│   ├── .vitepress/
│   │   ├── theme/          # テーマのカスタマイズ (index.ts, custom.css)
│   │   ├── components/     # UI コンポーネント (MemoEditor.vue)
│   │   ├── util/           # API 実装、Git 操作、スラグ変換等のロジック
│   │   ├── config.ts       # VitePress 基本設定
│   │   ├── sidebar.data.ts # サイドバーの動的生成ロジック
│   │   └── types.ts        # フロント・バックエンド共通型定義
│   ├── memo/               # 執筆された記事の保存先 (.md)
│   ├── index.md            # ホーム画面
│   └── input.md            # メモ作成画面 (Editor)
├── package.json
└── tsconfig.json
```

## 🛠 開発

```bash
pnpm install
pnpm run docs:dev
```

## 公開 URL

GitHub Pages 有効化後: [HungCat Notes](https://hungcat.github.io/notes/)

## デプロイ

`main`（または `master`）へ push すると [GitHub Actions](.github/workflows/deploy.yml) がビルドして同一リポジトリの GitHub Pages にデプロイします。

リポジトリの **Settings → Pages → Build and deployment** で **Source: GitHub Actions** を選んでください。
