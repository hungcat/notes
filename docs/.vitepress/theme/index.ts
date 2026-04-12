import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import MemoEditor from '../components/MemoEditor.vue'

/**
 * VitePress テーマの設定
 * デフォルトテーマを拡張し、グローバルコンポーネントの登録などを行う
 */
export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        // MemoEditor をグローバルに登録
        app.component('MemoEditor', MemoEditor)
    }
} satisfies Theme