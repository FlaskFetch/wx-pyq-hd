import React, { useEffect, useMemo, useRef } from 'react';
import { computeContainRect } from '../utils/fit';

type Props = {
  destW: number;
  destH: number;
  bg: string;
  srcCanvas: HTMLCanvasElement | null;
};

/**
 * 预览画布
 * - 为了性能，内部实际渲染尺寸会被限制在最大边不超过 1100 像素
 * - 仅用于预览；下载时会用全尺寸在另一个步骤生成
 */
export function PreviewCanvas({ destW, destH, bg, srcCanvas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 计算一个预览尺寸，保持目标宽高比，但限制最大像素
  const previewSize = useMemo(() => {
    const MAX_EDGE = 1100; // 预览最大边长
    const scale = Math.min(MAX_EDGE / destW, MAX_EDGE / destH, 1);
    const w = Math.round(destW * scale);
    const h = Math.round(destH * scale);
    return { w, h };
  }, [destW, destH]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = previewSize.w;
    cv.height = previewSize.h;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.save();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cv.width, cv.height);

    if (srcCanvas) {
      // 以预览画布为目标，进行 contain 贴合
      const r = computeContainRect(srcCanvas.width, srcCanvas.height, cv.width, cv.height);
      ctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, r.x, r.y, r.w, r.h);
    }
    ctx.restore();
  }, [previewSize.w, previewSize.h, bg, srcCanvas]);

  return (
    <div className="preview-wrapper">
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        role="img"
        aria-label="图片预览"
        width={previewSize.w}
        height={previewSize.h}
      />
    </div>
  );
}