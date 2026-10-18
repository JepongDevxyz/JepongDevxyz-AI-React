/* Sheet — bottom sheet primitive (Phase 2: 232px composer popup, etc).
   Backdrop click + Escape to close. */
import { useEffect } from "react";

export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="jd-sheet-backdrop"
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        className="jd-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="jd-sheet__grabber" aria-hidden="true" />
        {title && (
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
