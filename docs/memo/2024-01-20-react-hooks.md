---
title: React Hooksの使い方
date: 2024-01-20
tags: react, hooks, frontend
---

# React Hooksの使い方

React 16.8から導入されたHooksは、関数コンポーネントでstateやライフサイクルを扱えるようになりました。

## 主なHooks

### useState
```typescript
const [count, setCount] = useState(0);
```

### useEffect
```typescript
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);
```

### useContext
```typescript
const theme = useContext(ThemeContext);
```

Hooksを使うことで、クラスコンポーネントを書かずに複雑なUIを作成できます。