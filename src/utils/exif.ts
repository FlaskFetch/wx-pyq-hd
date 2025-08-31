import exifr from 'exifr';

/**
 * 读取 EXIF 方向（1..8）。若无或读取失败，返回 1
 * 参考：https://magnushoff.com/articles/jpeg-orientation/
 */
export async function readExifOrientation(file: Blob): Promise<number> {
  try {
    // exifr.parse 对 JPEG/HEIC 可能获取 Orientation 字段；未必所有图片都有
    const data: any = await exifr.parse(file, { translateValues: false });
    const o = (data && (data.Orientation || data.orientation)) ?? 1;
    if (typeof o === 'number' && o >= 1 && o <= 8) return o;
    return 1;
  } catch {
    return 1;
  }
}