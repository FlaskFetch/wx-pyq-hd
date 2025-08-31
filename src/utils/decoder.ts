import { readExifOrientation } from './exif';

export type ParsedImage = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

/**
 * 将文件解码为画布，并按 EXIF 方向归一化到正常朝向（不旋转内容的语义是指“旋转画布按钮不旋转内容”，
 * 此处是对某些相机存储的EXIF方向进行纠正，保证看到的内容是正的）。
 * - 优先走原生 <img> 解码（跨格式、兼容性最好）；
 * - 若是 HEIF/HEIC 且浏览器不支持，将抛出错误给上层处理（v1 不内置 wasm 解码器）。
 */
export async function parseAndNormalizeImage(file: File): Promise<ParsedImage> {
  const mime = (file.type || '').toLowerCase();

  // 读取 EXIF 方向（JPEG/HEIF 常见，PNG 通常无）
  const orientation = await readExifOrientation(file);

  // 先尝试使用 <img> 解码（支持的格式会直接成功）
  try {
    const img = await loadImageFromBlob(file);
    const { canvas, width, height } = drawWithOrientation(img, orientation);
    return { canvas, width, height };
  } catch (err) {
    // 若是 HEIF/HEIC，说明浏览器可能不支持
    if (mime.includes('heif') || mime.includes('heic') || hasHeifExtension(file.name)) {
      throw new Error('HEIF/HEIC 在当前浏览器不可用（v1 未内置解码器），请在支持的浏览器使用或转换为JPEG/PNG');
    }
    // 其他情况：继续抛出
    throw new Error('图片解码失败：' + (err as Error)?.message);
  }
}

function hasHeifExtension(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith('.heif') || n.endsWith('.heic');
}

async function loadImageFromBlob(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return img;
  } finally {
    // 不在此处 revoke，绘制完成后再由上层释放也可
    // 这里先不 revoke，避免部分浏览器在 onload 回调后立即使用时资源失效
    // 交由 GC 和浏览器 URL 管理；若要严格，可在外层完成绘制后 revoke
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('图片加载失败'));
    img.src = url;
  });
}

/**
 * 将图像按 EXIF 方向绘制到新画布，并返回画布与逻辑尺寸
 * 参考 EXIF 方向 1..8 的二维变换
 */
function drawWithOrientation(img: CanvasImageSource & { width: number; height: number }, orientation: number) {
  // 目标画布尺寸取决于是否旋转 90/270
  let drawW = img.width;
  let drawH = img.height;
  const swap = orientation === 5 || orientation === 6 || orientation === 7 || orientation === 8;
  if (swap) {
    drawW = img.height;
    drawH = img.width;
  }

  const canvas = document.createElement('canvas');
  canvas.width = drawW;
  canvas.height = drawH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D 上下文创建失败');

  ctx.save();

  // 根据 EXIF 方向进行变换
  switch (orientation) {
    case 2: // 水平翻转
      ctx.translate(drawW, 0);
      ctx.scale(-1, 1);
      break;
    case 3: // 旋转 180
      ctx.translate(drawW, drawH);
      ctx.rotate(Math.PI);
      break;
    case 4: // 垂直翻转
      ctx.translate(0, drawH);
      ctx.scale(1, -1);
      break;
    case 5: // 旋转90并垂直翻转
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -drawW);
      ctx.scale(1, -1);
      break;
    case 6: // 旋转90
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -drawW);
      break;
    case 7: // 旋转270并垂直翻转
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-drawH, 0);
      ctx.scale(1, -1);
      break;
    case 8: // 旋转270
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-drawH, 0);
      break;
    case 1:
    default:
      // 不变换
      break;
  }

  // 注意：在变换后的坐标系下，源图宽高使用原图 width/height
  ctx.drawImage(img as any, 0, 0);

  ctx.restore();

  // 输出逻辑尺寸为纠正后的画布尺寸
  return { canvas, width: canvas.width, height: canvas.height };
}