<template>
  <Layout>
    <template #sidebar-nav-after>
      <CustomSidebar />
    </template>

    <!-- 記事本文の後に何かを追加する場合（例：コメントセクション） -->
    <template #doc-after>
      <div class="custom-comment-area">
        <!-- <CommentComponent /> -->
      </div>
    </template>

    <!-- 右側の目次（Aside）の上部に何かを追加する場合 -->
    <template #aside-top>
      <div class="custom-aside-ad">
        <!-- おしらせなど -->
      </div>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import CustomSidebar from './CustomSidebar.vue'

const { Layout } = DefaultTheme
</script>

<style scoped>
/* トップレベルのセクション間のスペースを減らす */
:deep(.VPSidebarItem.level-0) {
  padding-bottom: 0 !important;
}
</style>
