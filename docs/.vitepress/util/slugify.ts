/**
 * 文字列をファイル名やURLに適した形式（スラグ）に変換します。
 */
export const slugify = (text: string): string =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}-]+/gu, "-") // Unicode文字（日本語含む）と数字、ハイフン以外をハイフンに置換
        .replace(/(^-|-$)/g, "")           // 先頭と末尾のハイフンを削除
        .replace(/-+/g, "-")              // 連続するハイフンを1つに集約
        .slice(0, 50) || "note";          // 最大50文字に制限し、空の場合は "note" を返す