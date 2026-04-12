<template>
  <!-- 動的グループ（日付/タグ）の切り替えパネル -->
  <div class="memo-sidebar-toggle-panel">
    <button 
      type="button" 
      :class="{ active: currentMode === 'date' }"
      @click="setMode('date')"
    >
      日付で表示
    </button>
    <button 
      type="button" 
      :class="{ active: currentMode === 'tag' }"
      @click="setMode('tag')"
    >
      タグで表示
    </button>
  </div>

  <div class="memo-sidebar-content">
    <div 
      v-for="group in sidebarGroups.filter(g => g.mode === currentMode)" 
      :key="group.label"
      class="memo-sidebar-group"
    >
      <div v-for="section in group.items" :key="section.text" class="memo-sidebar-section">
        <h3 
          class="memo-sidebar-section-title" 
          :class="{ expanded: expandedSections[`${currentMode}-${section.text}`] }"
          @click="toggleSection(`${currentMode}-${section.text}`)"
        >
          {{ section.text }}
        </h3>
        <ul v-show="expandedSections[`${currentMode}-${section.text}`]" class="memo-sidebar-items">
          <li v-for="item in section.items" :key="item.link" class="VPSidebarItem level-1">
            <div class="item">
              <div class="indicator"></div>
              <a class="link" :class="{ active: isPageActive(item.link) }" :href="item.link ? withBase(item.link) : '#'" 
                 @click="expandedSections[`${currentMode}-${section.text}`] = true">
                <p class="text">{{ item.text }}</p>
              </a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useData, withBase } from 'vitepress'
import type { MemoSidebarGroup, CustomThemeConfig, MemoSidebarItem } from '../../definitions/types'

// themeConfig (config.ts) の値を取得
const { theme, page } = useData<CustomThemeConfig>()

/**
 * 現在のページがアクティブ（選択中）かどうかを判定する
 */
const isPageActive = (link: string | undefined) => {
  if (!link) return false
  
  const normalize = (path: string) => 
    path.split('?')[0].split('#')[0] // クエリ/ハッシュ除去
        .replace(/^\//, '')          // 先頭スラッシュ除去
        .replace(/\.(md|html)$/, '') // 拡張子除去
        .replace(/\/$/, '');         // 末尾スラッシュ除去

  return normalize(page.value.relativePath) === normalize(link);
}

const storageKey = 'memoSidebarGroupMode'
const currentMode = ref<'tag' | 'date'>('tag')

/**
 * themeConfig.sidebar からデータを取得し、動的にグループ化を行う
 */
const sidebarGroups = computed<MemoSidebarGroup[]>(() => {
  const items = (theme.value.sidebar as unknown as MemoSidebarItem[]) || []
  
  const dateMap = new Map<string, MemoSidebarItem[]>()
  const tagMap = new Map<string, MemoSidebarItem[]>()

  items.forEach(item => {
    // 「はじめに」などメタデータがないものはスキップ、または個別に扱う
    if (!item.link || !item.link.includes('/memo/')) return

    // 日付グループ
    const month = item.date ? item.date.substring(0, 7) : 'その他'
    if (!dateMap.has(month)) dateMap.set(month, [])
    dateMap.get(month)!.push(item)

    // タググループ
    const tags = item.tags && item.tags.length > 0 ? item.tags : ['その他']
    tags.forEach(tag => {
      if (!tagMap.has(tag)) tagMap.set(tag, [])
      tagMap.get(tag)!.push(item)
    })
  })

  return [
    {
      mode: 'date',
      label: '日付表示',
      items: Array.from(dateMap.entries())
        .sort(([a], [b]) => {
          if (a === 'その他') return 1;
          if (b === 'その他') return -1;
          return b.localeCompare(a); // 月を新しい順に
        })
        .map(([text, items]) => ({ 
          text, 
          items: items.sort((a, b) => (b.date || '0000-00-00').localeCompare(a.date || '0000-00-00')) // 月内を新しい順に
        }))
    },
    {
      mode: 'tag',
      label: 'タグ表示',
      items: Array.from(tagMap.entries())
        .sort(([a], [b]) => a === 'その他' ? 1 : b === 'その他' ? -1 : a.localeCompare(b))
        .map(([tag, items]) => ({
          text: tag === 'その他' ? `その他 (${items.length})` : `${tag} (${items.length})`,
          items: items.sort((a, b) => (b.date || '0000-00-00').localeCompare(a.date || '0000-00-00')) // タグ内を新しい順に
        }))
    }
  ]
})

onMounted(() => {
  const saved = localStorage.getItem(storageKey)
  if (saved && (saved === 'tag' || saved === 'date')) {
    currentMode.value = saved
  }
})

const expandedSections = ref<Record<string, boolean>>({})

const toggleSection = (key: string) => {
  expandedSections.value[key] = !expandedSections.value[key]
}

const setMode = (mode: 'tag' | 'date') => {
  currentMode.value = mode
  localStorage.setItem(storageKey, mode)
}
</script>

<style scoped>
.memo-sidebar-toggle-panel {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1rem 0 0.75rem;
  padding: 0 1rem;
}
.memo-sidebar-toggle-panel button {
  font-size: 0.8rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.memo-sidebar-toggle-panel button.active {
  background: var(--vp-c-brand);
  color: var(--vp-c-white);
  border-color: var(--vp-c-brand);
}
.memo-sidebar-content {
  padding: 0;
}
.memo-sidebar-section-title {
  margin: 1rem 0 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.memo-sidebar-section-title::before {
  content: '▶';
  font-size: 0.6rem;
  transition: transform 0.2s;
  display: inline-block;
}
.memo-sidebar-section-title.static-title::before {
  display: none;
}
.memo-sidebar-section-title.expanded::before {
  transform: rotate(90deg);
}
.memo-sidebar-items {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 1.25rem;
}

/* VitePress 標準のスタイルを適用・微調整 */
.VPSidebarItem.level-1 {
  margin: 0;
}
.VPSidebarItem.level-1 .item {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.VPSidebarItem.level-1 .indicator {
  position: absolute;
  left: -16px;
  width: 2px;
  height: 16px;
  background-color: transparent;
  transition: background-color 0.25s;
}
.VPSidebarItem.level-1 .link.active .indicator {
  background-color: var(--vp-c-brand-1);
}
.VPSidebarItem.level-1 .text {
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: color 0.25s;
}
.VPSidebarItem.level-1 .link.active .text {
  color: var(--vp-c-brand-1);
}
</style>