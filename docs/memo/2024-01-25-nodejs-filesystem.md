---
title: Node.jsでのファイル操作
date: 2024-01-25
tags: nodejs, filesystem, backend
---

# Node.jsでのファイル操作

Node.jsにはファイルシステムを操作するための`fs`モジュールが用意されています。

## 同期 vs 非同期

### 同期操作（ブロック）
```javascript
const fs = require('fs');
const data = fs.readFileSync('file.txt', 'utf8');
console.log(data);
```

### 非同期操作（非ブロック）
```javascript
const fs = require('fs').promises;
fs.readFile('file.txt', 'utf8')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

## PromiseベースのAPI

Node.js 10+ではPromiseベースのAPIが利用可能です。

```javascript
const fs = require('fs').promises;

async function readFile() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
```

ファイル操作はI/Oバウンドなので、非同期APIを積極的に活用しましょう。