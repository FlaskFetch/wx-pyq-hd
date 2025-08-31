import React, { useRef } from 'react';

type Props = {
  onFileSelected: (file: File | null) => void;
};

export function Uploader({ onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    onFileSelected(f);
  };

  const onClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/heic,image/heif"
        className="hidden"
        onChange={onChange}
      />
      <button type="button" className="btn-primary" onClick={onClick} aria-label="选择图片">
        选择图片
      </button>
      <span className="text-xs text-neutral-400">
        支持 PNG / JPEG / HEIF（不上传到服务器，仅本地处理）
      </span>
    </div>
  );
}