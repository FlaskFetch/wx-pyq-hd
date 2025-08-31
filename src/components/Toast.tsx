import React, { useCallback, useState } from 'react';

export type ToastType = 'info' | 'success' | 'error';

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number; // 可选：自动消失时长
};

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((t: ToastItem) => {
    setToasts((prev) => {
      // 去重（同 id 不重复加入）
      if (prev.some((x) => x.id === t.id)) return prev;
      return [...prev, t];
    });

    // 若设置了自动消失
    if (t.durationMs && t.durationMs > 0) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.durationMs);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts, pushToast, removeToast };
}

type ToastContainerProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => {
        const cls =
          t.type === 'success'
            ? 'toast toast-success'
            : t.type === 'error'
            ? 'toast toast-error'
            : 'toast toast-info';
        return (
          <div key={t.id} className={cls}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">{t.message}</div>
              <button
                type="button"
                aria-label="关闭提示"
                className="btn-ghost px-2 py-1"
                onClick={() => onDismiss(t.id)}
              >
                关闭
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}