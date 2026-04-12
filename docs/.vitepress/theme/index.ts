import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './components/Layout.vue'
import MemoEditor from './components/MemoEditor.vue'

/**
 * VitePress テーマの設定
 * デフォルトテーマを拡張し、グローバルコンポーネントの登録などを行う
 */
export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        // MemoEditor をグローバルに登録
        app.component('MemoEditor', MemoEditor)
    }
} satisfies Theme