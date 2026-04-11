/**
 * 文字列をファイル名やURLに適した形式（スラグ）に変換します。
 * 
 * 1. 小文字化とトリム
 * 2. Unicode文字（日本語含む）/数字/ハイフン以外をハイフンに変換
 * 3. 連続するハイフンの集約と両端の削除
 * 
 * @param {string} text - スラグ化する元の文字列
 * @returns {string} 変換後のスラグ文字列
 */
export const slugify = (text: string): string =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}-]+/gu, "-") // Unicode文字（日本語含む）と数字、ハイフン以外をハイフンに置換
        .replace(/(^-|-$)/g, "")           // 先頭と末尾のハイフンを削除
        .replace(/-+/g, "-")              // 連続するハイフンを1つに集約
        .slice(0, 50) || "note";          // 最大50文字に制限し、空の場合は "note" を返す