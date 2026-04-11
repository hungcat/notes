<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import type { MemoData } from '../types'

// markdown-it の初期化
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs">' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
})

const title = ref('')
const tags = ref('')
const content = ref('')
const isDirty = ref(false)
const statusMessage = ref('')
const lastSavedPath = ref('')
const saving = ref(false)

// ページ読み込み時にキャッシュから復元
onMounted(() => {
  const saved = localStorage.getItem('memo_draft_cache')
  if (saved) {
    const { t, tg, c, p } = JSON.parse(saved)
    title.value = t || ''
    tags.value = tg || ''
    content.value = c || ''
    lastSavedPath.value = p || ''
  }
})

const renderedContent = computed(() => md.render(content.value))

const saveDraftToLocalStorage = () => {
  localStorage.setItem('memo_draft_cache', JSON.stringify({
    t: title.value,
    tg: tags.value,
    c: content.value,
    p: lastSavedPath.value
  }))
}

watch([title, tags, content, lastSavedPath], () => {
  saveDraftToLocalStorage()
  if (title.value || tags.value || content.value) {
    isDirty.value = true
  }
})

const slugify = (text: string) => text.trim().toLowerCase().replace(/\s+/g, '-')

const saveMemo = async () => {
  if (!title.value || !content.value) {
    alert('タイトルと内容を入力してください')
    return
  }

  saving.value = true
  statusMessage.value = '保存中...'

  try {
    const dateStr = new Date().toISOString().split('T')[0]
    const fileName = `${dateStr}-${slugify(title.value)}`

    const payload: MemoData = {
      title: title.value,
      tags: tags.value.split(/[,、]/).map(t => t.trim()).filter(Boolean),
      content: content.value,
      date: dateStr,
      fileName
    }

    const response = await fetch('/api/save-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '保存に失敗しました')

    lastSavedPath.value = data.path
    statusMessage.value = `下書きを保存しました: ${data.path}`
    isDirty.value = false
  } catch (error: any) {
    statusMessage.value = `エラー: ${error.message}`
  } finally {
    saving.value = false
  }
}

const pushToGit = async () => {
  if (!lastSavedPath.value) return
  saving.value = true
  statusMessage.value = 'Git Push実行中...'

  try {
    const response = await fetch('/api/push-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: lastSavedPath.value,
        commitMessage: `Add note: ${title.value}`
      })
    })

    if (!response.ok) throw new Error('Pushに失敗しました')
    statusMessage.value = 'Gitへの反映が完了しました！'
    lastSavedPath.value = ''
  } catch (error: any) {
    statusMessage.value = `エラー: ${error.message}`
  } finally {
    saving.value = false
  }
}

const deleteMemo = (force = false) => {
  if (!force && isDirty.value && !confirm('入力内容を破棄しますか？')) return
  title.value = ''; tags.value = ''; content.value = ''; isDirty.value = false;
  localStorage.removeItem('memo_draft_cache')
  lastSavedPath.value = ''; statusMessage.value = force ? '' : 'クリアされました'
}
</script>

<template>
  <div class="memo-editor-container">
    <div class="editor-pane">
      <div class="field">
        <label>タイトル</label>
        <input v-model="title" type="text" placeholder="メモのタイトルを入力" />
      </div>
      <div class="field">
        <label>タグ</label>
        <input v-model="tags" type="text" placeholder="タグをカンマ区切りで入力" />
      </div>
      <div class="field">
        <label>内容 (Markdown)</label>
        <textarea v-model="content" placeholder="Markdown形式で入力"></textarea>
      </div>
      <div class="actions">
        <button @click="saveMemo" class="btn save-btn" :disabled="saving">1. 下書き保存</button>
        <button @click="pushToGit" class="btn push-btn" :disabled="saving || !lastSavedPath">2. コミット & Push</button>
        <button @click="deleteMemo(false)" class="btn delete-btn">削除</button>
      </div>
      <p v-if="statusMessage" class="status-bar">{{ statusMessage }}</p>
    </div>
    <div class="preview-pane">
      <h3>プレビュー</h3>
      <div class="preview-content vp-doc" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<style scoped>
/* Editor Styles */
.memo-editor-container { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
@media (min-width: 1024px) {
  .memo-editor-container { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
}
.editor-pane, .preview-pane {
  border: 1px solid var(--vp-c-divider); padding: 20px; border-radius: 8px;
  background: var(--vp-c-bg-soft); display: flex; flex-direction: column;
}
.field { margin-bottom: 15px; }
.field label { display: block; margin-bottom: 5px; font-weight: bold; }
.field input, .field textarea {
  width: 100%; padding: 10px; border: 1px solid var(--vp-c-bg-alt);
  border-radius: 4px; background: var(--vp-c-bg); color: var(--vp-c-text-1);
}
.field textarea { height: 70vh; font-family: var(--vp-font-family-mono); resize: none; }
.actions { display: flex; gap: 10px; margin-bottom: 10px; }
.btn { padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; border: none; }
.save-btn { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); border: 1px solid var(--vp-c-brand-1); }
.push-btn { background: var(--vp-c-brand-1); color: white; }
.delete-btn { background: var(--vp-c-red-dimm); color: var(--vp-c-red-1); border: 1px solid var(--vp-c-red-1); }
.status-bar { font-size: 0.9em; color: var(--vp-c-brand-1); font-weight: bold; }
.preview-content { 
  flex-grow: 1; min-height: 70vh; max-height: 80vh; overflow-y: auto;
  background: var(--vp-c-bg); padding: 15px; border-radius: 4px;
}
/* Ensure code blocks look like VitePress docs */
:deep(.vp-doc pre) { background-color: var(--vp-code-block-bg); padding: 16px; border-radius: 8px; }
</style>