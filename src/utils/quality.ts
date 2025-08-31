/**
 * 将 canvas 导出为 JPEG，并通过质量二分寻优尽量保持画质同时将体积控制在 maxBytes 以下。
 * - 返回最终使用的质量、Blob 以及字节数
 * - 若无法低于 maxBytes，则返回最小质量下的结果
 */
export async function exportJpegUnderSize(
  canvas: HTMLCanvasElement,
  maxBytes: number,
  options?: {
    minQ?: number; // 最低质量下限（包含）
    maxQ?: number; // 最高质量上限（包含）
    maxIters?: number; // 最大迭代次数
    timeoutMs?: number; // 超时（毫秒），到时返回当前最好结果
  }
): Promise<{ blob: Blob; size: number; quality: number }> {
  const minQ = clamp(options?.minQ ?? 0.4, 0.05, 0.95);
  const maxQ = clamp(options?.maxQ ?? 0.95, 0.05, 0.99);
  const maxIters = options?.maxIters ?? 8;
  const timeoutMs = options?.timeoutMs ?? 3500;

  const deadline = Date.now() + timeoutMs;

  // 先尝试高质量
  let lo = minQ;
  let hi = maxQ;

  let bestBlob: Blob | null = null;
  let bestSize = Number.POSITIVE_INFINITY;
  let bestQ = lo;

  // 记录一个始终满足 <= maxBytes 的“可行解”
  let feasibleBlob: Blob | null = null;
  let feasibleSize = Number.POSITIVE_INFINITY;
  let feasibleQ = lo;

  for (let i = 0; i < maxIters; i++) {
    // 超时保护
    if (Date.now() > deadline) break;

    const mid = i === 0 ? hi : (lo + hi) / 2; // 首次优先尝试较高质量
    const { blob, size } = await toJpeg(canvas, mid);

    // 更新最佳（尽量接近 maxBytes 下界）
    if (size < bestSize) {
      bestBlob = blob;
      bestSize = size;
      bestQ = mid;
    }

    if (size <= maxBytes) {
      // 记录一份可行解，并尝试提高质量（向上半区搜索）
      if (size < feasibleSize) {
        feasibleBlob = blob;
        feasibleSize = size;
        feasibleQ = mid;
      }
      lo = mid; // 可以尝试更高质量
      // 若越接近上界差距越小，提前结束
      if (Math.abs(hi - lo) < 0.01) break;
    } else {
      // 超出上限，降低质量
      hi = mid;
      // 若区间过小，提前结束
      if (Math.abs(hi - lo) < 0.01) break;
    }
  }

  // 结束后优先返回“可行解”，否则返回最佳（可能超出上限）
  if (feasibleBlob) {
    return { blob: feasibleBlob, size: feasibleSize, quality: round2(feasibleQ) };
  }
  if (bestBlob) {
    return { blob: bestBlob, size: bestSize, quality: round2(bestQ) };
  }

  // 理论上不会到这里；兜底再次导出最小质量
  const fallback = await toJpeg(canvas, minQ);
  return { blob: fallback.blob, size: fallback.size, quality: round2(minQ) };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function toJpeg(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<{ blob: Blob; size: number }> {
  const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  const size = blob.size;
  return { blob, size };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Safari/部分浏览器的 toBlob 在低内存或高分辨率下可能返回 null，进行兜底
    try {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else {
            try {
              const dataUrl = canvas.toDataURL(type, quality);
              const b2 = dataURLToBlob(dataUrl);
              resolve(b2);
            } catch (err) {
              reject(err);
            }
          }
        },
        type,
        quality
      );
    } catch (err) {
      try {
        const dataUrl = canvas.toDataURL(type, quality);
        const b2 = dataURLToBlob(dataUrl);
        resolve(b2);
      } catch (err2) {
        reject(err2);
      }
    }
  });
}

function dataURLToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(parts[1] ?? '');
  const n = bstr.length;
  const u8 = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8], { type: mime });
}