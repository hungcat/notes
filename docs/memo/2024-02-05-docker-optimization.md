---
title: Dockerコンテナの最適化
date: 2024-02-05
tags: docker, container, devops
---

# Dockerコンテナの最適化

Dockerコンテナのサイズを小さく保つことで、ビルド時間とデプロイ時間を短縮できます。

## マルチステージビルド

```dockerfile
# ビルドステージ
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 実行ステージ
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## .dockerignoreの活用

```
node_modules
.git
*.md
.env
```

## Alpine Linuxの使用

```dockerfile
FROM node:18-alpine
# Alpineは軽量なLinuxディストリビューション
```

## レイヤーの最適化

- 変更頻度の高いファイルを後でCOPY
- RUNコマンドをまとめてレイヤー数を減らす
- キャッシュを活用

## セキュリティ

- 非rootユーザーで実行
- 不要なパッケージを削除
- 脆弱性スキャンを実施

最適化されたコンテナは開発効率を大幅に向上させます。