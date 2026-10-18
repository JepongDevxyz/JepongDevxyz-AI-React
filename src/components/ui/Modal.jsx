/* Modal — centered dialog primitive. Backdrop click + Escape to close. */
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, wide = false }) {
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
      className="jd-modal-backdrop"
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        className="jd-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={wide ? { maxWidth: 720 } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
