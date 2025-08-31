import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exportJpegUnderSize } from '../../src/utils/quality';

function makeCanvas(): HTMLCanvasElement {
  const cv = document.createElement('canvas') as HTMLCanvasElement;
  cv.width = 100;
  cv.height = 50;
  return cv;
}

describe('[exportJpegUnderSize()](src/utils/quality.ts:6)', () => {
  let origToBlob: any;
  let origToDataURL: any;

  beforeAll(() => {
    origToBlob = (HTMLCanvasElement.prototype as any).toBlob;
    origToDataURL = (HTMLCanvasElement.prototype as any).toDataURL;
  });

  afterAll(() => {
    (HTMLCanvasElement.prototype as any).toBlob = origToBlob;
    (HTMLCanvasElement.prototype as any).toDataURL = origToDataURL;
  });

  it('finds a quality under the size cap using bisection-like search', async () => {
    // size grows linearly with quality: size ~= q * 2000 bytes
    (HTMLCanvasElement.prototype as any).toBlob = function (
      cb: (b: Blob | null) => void,
      type: string,
      quality?: number
    ) {
      const q = typeof quality === 'number' ? quality : 0.92;
      const size = Math.round(q * 2000);
      const blob = new Blob([new Uint8Array(size)], { type });
      cb(blob);
    };

    const cv = makeCanvas();
    const maxBytes = 1000;
    const { size, quality } = await exportJpegUnderSize(cv, maxBytes, {
      minQ: 0.1,
      maxQ: 0.95,
      maxIters: 10,
      timeoutMs: 2000,
    });

    expect(size).toBeLessThanOrEqual(maxBytes);
    // Given our mapping, expect quality around ~0.5
    expect(quality).toBeGreaterThan(0.3);
    expect(quality).toBeLessThan(0.6);
  });

  it('returns the best (near minQ) when no feasible solution under cap exists', async () => {
    // Always above cap: size = 5000 + 1000*q
    (HTMLCanvasElement.prototype as any).toBlob = function (
      cb: (b: Blob | null) => void,
      type: string,
      quality?: number
    ) {
      const q = typeof quality === 'number' ? quality : 0.92;
      const size = 5000 + Math.round(q * 1000);
      const blob = new Blob([new Uint8Array(size)], { type });
      cb(blob);
    };

    const cv = makeCanvas();
    const res = await exportJpegUnderSize(cv, 1000, {
      minQ: 0.4,
      maxQ: 0.95,
      maxIters: 10,
      timeoutMs: 2000,
    });

    expect(res.size).toBeGreaterThan(1000);
    // Search converges toward the lower bound but not below it
    expect(res.quality).toBeGreaterThanOrEqual(0.4);
    expect(res.quality).toBeLessThanOrEqual(0.5);
  });

  it('falls back to dataURL path when toBlob yields null', async () => {
    // Force toBlob to yield null so code takes dataURL fallback
    (HTMLCanvasElement.prototype as any).toBlob = function (
      cb: (b: Blob | null) => void,
      _type: string,
      _quality?: number
    ) {
      cb(null);
    };
    // 1024 base64 chars -> 1024/4*3 = 768 bytes after atob
    (HTMLCanvasElement.prototype as any).toDataURL = function (
      type: string,
      _quality?: number
    ) {
      const base64 = 'A'.repeat(1024);
      return 'data:image/jpeg;base64,' + base64;
    };

    const cv = makeCanvas();
    const out = await exportJpegUnderSize(cv, 1_000_000);
    expect(out.size).toBe(768);
    expect(out.blob.type).toBe('image/jpeg');
  });
});