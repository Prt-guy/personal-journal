// Minimal accessible modal. Used only where a flow needs confirmation (delete).
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer }) {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-900">
        {title && (
          <h2 className="mb-2 text-lg font-medium text-stone-800 dark:text-stone-100">
            {title}
          </h2>
        )}
        <div className="text-sm text-stone-600 dark:text-stone-400">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
