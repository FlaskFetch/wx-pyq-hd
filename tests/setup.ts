import '@testing-library/jest-dom';

/**
 * Canvas toBlob polyfill for jsdom when missing.
 * This helps tests that rely on toBlob fallback paths.
 * Based on dataURL conversion used in [quality.exportJpegUnderSize()](src/utils/quality.ts:98).
 */
if (!(HTMLCanvasElement.prototype as any).toBlob) {
  (HTMLCanvasElement.prototype as any).toBlob = function toBlob(
    callback: (blob: Blob | null) => void,
    type?: string,
    quality?: any
  ) {
    try {
      const dataUrl = (this as HTMLCanvasElement).toDataURL(type, quality);
      const [header, b64] = dataUrl.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : type || 'image/png';
      const binStr = atob(b64 || '');
      const len = binStr.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) u8[i] = binStr.charCodeAt(i);
      callback(new Blob([u8], { type: mime }));
    } catch {
      callback(null);
    }
  };
}