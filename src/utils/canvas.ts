import { computeContainRect } from './fit';

type RenderParams = {
  destW: number;
  destH: number;
  bg: string;
  srcCanvas: HTMLCanvasElement;
};

/**
 * renderToCanvas()
 * 以 contain 策略将 srcCanvas 渲染到指定尺寸的新画布上，并填充背景色
 */
export function renderToCanvas({ destW, destH, bg, srcCanvas }: RenderParams): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = destW;
  out.height = destH;

  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D 上下文创建失败');

  ctx.save();
  // 背景
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, destW, destH);

  // contain 贴合
  const r = computeContainRect(srcCanvas.width, srcCanvas.height, destW, destH);
  ctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, r.x, r.y, r.w, r.h);

  ctx.restore();
  return out;
}