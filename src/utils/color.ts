/**
 * 判断十六进制颜色是否有效，支持 #RGB 或 #RRGGBB，大小写皆可
 */
export function isValidHex(input: string): boolean {
  if (!input) return false;
  const s = input.trim();
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
}

/**
 * 标准化为 #RRGGBB 形式；若无效则回退为 #000000
 */
export function ensureHex6(input: string): string {
  if (!isValidHex(input)) return '#000000';
  let s = input.trim();
  if (s[0] !== '#') s = '#' + s;
  if (s.length === 4) {
    // #RGB -> #RRGGBB
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return s.toLowerCase();
}