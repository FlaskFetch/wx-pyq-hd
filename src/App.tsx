import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import { Uploader } from './components/Uploader';
import { ControlsPanel } from './components/ControlsPanel';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ToastContainer, useToasts } from './components/Toast';
import { computeContainRect } from './utils/fit';
import { parseAndNormalizeImage } from './utils/decoder';
import { ensureHex6, isValidHex } from './utils/color';
import { renderToCanvas } from './utils/canvas';
import { exportJpegUnderSize } from './utils/quality';

type OrientationMode = 'landscape' | 'portrait';
type BgMode = 'black' | 'white' | 'custom';

const LANDSCAPE_SIZE = { w: 4400, h: 2200 };
const PORTRAIT_SIZE = { w: 2200, h: 4400 };
const MAX_BYTES = 5 * 1024 * 1024;

export default function App() {
  const { toasts, pushToast, removeToast } = useToasts();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sourceInfo, setSourceInfo] = useState<{ w: number; h: number; ratio: number } | null>(null);

  const [orientation, setOrientation] = useState<OrientationMode>('landscape');
  const [bgMode, setBgMode] = useState<BgMode>('black');
  const [bgHex, setBgHex] = useState<string>('#000000');

  const onRotateCanvas = useCallback(() => {
    setOrientation((prev) => (prev === 'landscape' ? 'portrait' : 'landscape'));
  }, []);

  const onBgModeChange = useCallback((mode: BgMode) => {
    setBgMode(mode);
  }, []);

  const onBgHexChange = useCallback((hex: string) => {
    setBgHex(hex);
  }, []);

  const effectiveBg = useMemo(() => {
    if (bgMode === 'black') return '#000000';
    if (bgMode === 'white') return '#ffffff';
    return isValidHex(bgHex) ? ensureHex6(bgHex) : '#000000';
  }, [bgMode, bgHex]);

  const onFileSelected = useCallback(async (file: File | null) => {
    setSourceFile(file);
    setSourceCanvas(null);
    setSourceInfo(null);
    if (!file) return;

    try {
      const { canvas, width, height } = await parseAndNormalizeImage(file);
      setSourceCanvas(canvas);
      const longSide = Math.max(width, height);
      const shortSide = Math.min(width, height);
      const ratio = longSide / Math.max(1, shortSide);
      setSourceInfo({ w: width, h: height, ratio });

      // 初始画布朝向：依据源图朝向选择更匹配的一边
      if (width >= height) {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }

      if (ratio >= 2) {
        pushToast({
          id: 'ratio-met-' + Date.now(),
          type: 'info',
          message: '已满足比例条件：长边/短边 ≥ 2',
        });
      }
    } catch (err: any) {
      console.error(err);
      pushToast({
        id: 'decode-error-' + Date.now(),
        type: 'error',
        message: '图片解码失败：' + (err?.message || '未知错误'),
      });
    }
  }, [pushToast]);

  const doDownload = useCallback(async () => {
    if (!sourceCanvas) {
      pushToast({
        id: 'no-source-' + Date.now(),
        type: 'error',
        message: '请先选择一张图片',
      });
      return;
    }
    const { w: targetW, h: targetH } =
      orientation === 'landscape' ? LANDSCAPE_SIZE : PORTRAIT_SIZE;

    try {
      // 全尺寸渲染
      const fullCanvas = renderToCanvas({
        destW: targetW,
        destH: targetH,
        bg: effectiveBg,
        srcCanvas: sourceCanvas,
      });

      const { blob, size, quality } = await exportJpegUnderSize(fullCanvas, MAX_BYTES);

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date();
      const tsStr = `${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(
        ts.getDate()
      ).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(
        ts.getMinutes()
      ).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}`;
      a.href = blobUrl;
      a.download = `wx-hd-${orientation}-${targetW}x${targetH}-${tsStr}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      if (size < MAX_BYTES) {
        pushToast({
          id: 'size-met-' + Date.now(),
          type: 'success',
          message: `已满足体积条件：${(size / 1024 / 1024).toFixed(2)} MB（q=${quality.toFixed(2)}）`,
        });
      } else {
        pushToast({
          id: 'size-not-met-' + Date.now(),
          type: 'info',
          message: `导出体积 ${(size / 1024 / 1024).toFixed(2)} MB，已尽力优化，建议尝试更小的源图或再次下载`,
        });
      }
    } catch (err: any) {
      console.error(err);
      pushToast({
        id: 'download-error-' + Date.now(),
        type: 'error',
        message: '导出失败：' + (err?.message || '未知错误'),
      });
    }
  }, [sourceCanvas, orientation, effectiveBg, pushToast]);

  const previewConfig = useMemo(() => {
    const { w: targetW, h: targetH } =
      orientation === 'landscape' ? LANDSCAPE_SIZE : PORTRAIT_SIZE;

    if (!sourceCanvas) {
      return {
        destW: targetW,
        destH: targetH,
        bg: effectiveBg,
        srcCanvas: null as HTMLCanvasElement | null,
      };
    }
    return {
      destW: targetW,
      destH: targetH,
      bg: effectiveBg,
      srcCanvas: sourceCanvas,
    };
  }, [orientation, effectiveBg, sourceCanvas]);

  return (
    <div className="container py-6 md:py-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">朋友圈高清图画布工具</h1>
        <p className="text-sm text-neutral-400 mt-1">
          满足“长边/短边 ≥ 2”与“体积 &lt; 5MB”时，理论上发圈不被压缩。此工具仅在本地处理，不上传图片。
        </p>
      </header>

      <section className="card p-4 md:p-6">
        <Uploader onFileSelected={onFileSelected} />
        {sourceInfo && (
          <div className="mt-3 text-xs text-neutral-300">
            源图尺寸：{sourceInfo.w} × {sourceInfo.h}，长短边比：{sourceInfo.ratio.toFixed(3)}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PreviewCanvas
              destW={previewConfig.destW}
              destH={previewConfig.destH}
              bg={previewConfig.bg}
              srcCanvas={previewConfig.srcCanvas}
            />
          </div>
          <div className="lg:col-span-1">
            <ControlsPanel
              orientation={orientation}
              onRotateCanvas={onRotateCanvas}
              bgMode={bgMode}
              onBgModeChange={onBgModeChange}
              bgHex={bgHex}
              onBgHexChange={onBgHexChange}
              effectiveBg={effectiveBg}
              onDownload={doDownload}
            />
          </div>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} wx-pyq-hd · 仅供学习与研究使用
      </footer>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}