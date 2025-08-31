export type Rect = { x: number; y: number; w: number; h: number };

/**
 * computeContainRect
 * 在目标画布中以 contain 策略等比缩放并居中放置源图
 */
export function computeContainRect(
  srcW: number,
  srcH: number,
  destW: number,
  destH: number
): Rect {
  if (srcW <= 0 || srcH <= 0 || destW <= 0 || destH <= 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  const scale = Math.min(destW / srcW, destH / srcH);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const x = Math.round((destW - w) / 2);
  const y = Math.round((destH - h) / 2);
  return { x, y, w, h };
}