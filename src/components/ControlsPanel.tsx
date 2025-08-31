import React, { useMemo } from 'react';

type OrientationMode = 'landscape' | 'portrait';
type BgMode = 'black' | 'white' | 'custom';

type Props = {
  orientation: OrientationMode;
  onRotateCanvas: () => void;

  bgMode: BgMode;
  onBgModeChange: (mode: BgMode) => void;

  bgHex: string;
  onBgHexChange: (hex: string) => void;

  effectiveBg: string;
  onDownload: () => void;
};

export function ControlsPanel(props: Props) {
  const {
    orientation,
    onRotateCanvas,
    bgMode,
    onBgModeChange,
    bgHex,
    onBgHexChange,
    effectiveBg,
    onDownload,
  } = props;

  const isPortrait = orientation === 'portrait';

  const previewStyle = useMemo(
    () => ({
      backgroundColor: effectiveBg,
    }),
    [effectiveBg]
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="section-title mb-2">画布</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={onRotateCanvas}
            aria-label="旋转画布（不旋转图片内容）"
            title="旋转画布（不旋转图片内容）"
          >
            旋转画布
          </button>
          <span className="text-xs text-neutral-400">
            当前：{isPortrait ? '竖幅 2200×4400' : '横幅 4400×2200'}
          </span>
        </div>
      </div>

      <div>
        <div className="section-title mb-2">背景颜色</div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 label">
            <input
              type="radio"
              name="bg"
              value="black"
              checked={bgMode === 'black'}
              onChange={() => onBgModeChange('black')}
            />
            黑色
          </label>
          <label className="inline-flex items-center gap-2 label">
            <input
              type="radio"
              name="bg"
              value="white"
              checked={bgMode === 'white'}
              onChange={() => onBgModeChange('white')}
            />
            白色
          </label>
          <label className="inline-flex items-center gap-2 label">
            <input
              type="radio"
              name="bg"
              value="custom"
              checked={bgMode === 'custom'}
              onChange={() => onBgModeChange('custom')}
            />
            自定义
          </label>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="#000000"
            value={bgHex}
            onChange={(e) => onBgHexChange(e.target.value)}
            disabled={bgMode !== 'custom'}
            aria-label="自定义背景色（十六进制）"
          />
          <div
            className="w-8 h-8 rounded border border-neutral-600"
            style={previewStyle}
            aria-label="颜色预览"
            title={effectiveBg}
          />
        </div>
        <div className="mt-1 text-xs text-neutral-400">示例：#000、#000000、#1a2b3c</div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={onDownload}
          aria-label="下载图片"
        >
          下载
        </button>
      </div>
    </div>
  );
}