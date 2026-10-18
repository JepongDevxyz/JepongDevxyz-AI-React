/* Toast.jsx — bottom-centered stack, theme-synced,
   branded "Powered by Jepong Devxyz". XSS-safe: React escapes text. */
export default function ToastStack({ toasts }) {
  return (
    <div className="jd-toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="jd-toast" key={t.id}>
          <span className="jd-toast__msg">{t.msg}</span>
          <span className="jd-toast__brand">Powered by Jepong Devxyz</span>
        </div>
      ))}
    </div>
  );
}
