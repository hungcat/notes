<template>
  <div>
    <h1>メモ入力</h1>
    <p v-if="!isDev" class="warning">
      このページは開発モード限定です。GitHub Pages上の公開サイトでは保存機能は利用できません。
    </p>
    <form @submit.prevent="generateMemo">
      <div>
        <label for="title">タイトル:</label>
        <input id="title" v-model="title" required />
      </div>
      <div>
        <label for="fileName">出力ファイル名（省略可）:</label>
        <input id="fileName" v-model="fileName" placeholder="YYYY-MM-DD-title 形式" />
      </div>
      <div>
        <label for="content">内容:</label>
        <textarea id="content" v-model="content" rows="10" required></textarea>
      </div>
      <button type="submit">メモ生成</button>
    </form>
    <div v-if="generatedMemo">
      <h2>生成されたメモ</h2>
      <pre>{{ generatedMemo }}</pre>
      <div class="actions">
        <button @click="downloadMemo">ダウンロード</button>
        <button v-if="isDev" @click="saveToRepo" :disabled="saving">保存してリポジトリに登録</button>
      </div>
      <p v-if="saveResult" class="result">{{ saveResult }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('')
const fileName = ref('')
const content = ref('')
const generatedMemo = ref('')
const saving = ref(false)
const saveResult = ref('')
const isDev = import.meta.env.DEV

const generateMemo = () => {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const tags = content.value.match(/#\w+/g) || []
  const tagString = tags.length > 0 ? `\ntags: ${tags.join(', ')}` : ''

  generatedMemo.value = `---
title: ${title.value}
date: ${date}${tagString}
---

${content.value}
`
  saveResult.value = ''
}

const saveToRepo = async () => {
  if (!generatedMemo.value) {
    saveResult.value = '先にメモを生成してください。'
    return
  }
  if (!isDev) {
    saveResult.value = 'この機能は開発モードでのみ利用可能です。'
    return
  }

  saving.value = true
  saveResult.value = ''

  try {
    const response = await fetch('/__api/save-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.value,
        content: content.value,
        fileName: fileName.value,
        commitMessage: `Add note: ${title.value}`,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || '保存に失敗しました。')
    }

    saveResult.value = `保存しました: ${data.path}`
  } catch (error) {
    saveResult.value = `エラー: ${error.message}`
  } finally {
    saving.value = false
  }
}

const downloadMemo = () => {
  const blob = new Blob([generatedMemo.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.value.replace(/\s+/g, '_')}.md`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
form div {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
input,
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--vp-border-color, #ccc);
  border-radius: 4px;
  background: var(--vp-canvas-bg, #fff);
  color: var(--vp-text-color, #000);
}
button {
  padding: 0.5rem 1rem;
  background-color: var(--vp-brand, #007acc);
  color: var(--vp-button-text, #fff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: var(--vp-brand-emphasis, #005aa3);
}
.actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
}
pre {
  background-color: var(--vp-code-block-bg, var(--vp-code-bg, #f4f4f4));
  color: var(--vp-code-block-color, var(--vp-text-color, #000));
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}
.warning {
  color: var(--vp-text-color, #b54949);
  background: var(--vp-border-color, #fff0f0);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}
.result {
  margin-top: 1rem;
  white-space: pre-wrap;
  color: var(--vp-text-color, #000);
}
</style>