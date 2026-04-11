<template>
  <Layout>
    <template #sidebar-nav-after>
      <div class="memo-sidebar-toggle-panel">
        <button 
          type="button" 
          :class="{ active: currentMode === 'tag' }"
          @click="setMode('tag')"
        >
          タグで表示
        </button>
        <button 
          type="button" 
          :class="{ active: currentMode === 'date' }"
          @click="setMode('date')"
        >
          日付で表示
        </button>
      </div>

      <div class="memo-sidebar-content">
        <div 
          v-for="group in sidebarData.groups.filter((g: MemoSidebarGroup) => g.mode === currentMode)" 
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
              <li v-for="item in section.items" :key="item.link" class="memo-sidebar-item">
                <a :href="item.link ? withBase(item.link) : '#'" class="memo-sidebar-link">{{ item.text }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { MemoSidebarGroup, data as sidebarData } from '../sidebar.data'

const { Layout } = DefaultTheme

const storageKey = 'memoSidebarGroupMode'
const currentMode = ref<'tag' | 'date'>('tag')

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
  padding: 0 1rem;
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
.memo-sidebar-section-title.expanded::before {
  transform: rotate(90deg);
}
.memo-sidebar-items {
  list-style: none;
  padding: 0;
  margin: 0;
}
.memo-sidebar-item {
  margin: 4px 0;
  padding-left: 0.5rem;
}
.memo-sidebar-link {
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.2s;
}
.memo-sidebar-link:hover {
  color: var(--vp-c-brand);
}
/* トップレベルのセクション間のスペースを減らす */
:deep(.VPSidebarItem.level-0) {
  padding-bottom: 0 !important;
}
</style>
