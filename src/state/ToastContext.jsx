/* ToastContext — toast(msg): bottom-centered, theme-synced,
   branded "Powered by Jepong Devxyz". XSS-safe (React escapes text). */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import ToastStack from "../components/ui/Toast.jsx";

const ToastContext = createContext(null);
const TOAST_TTL_MS = 3200;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((msg) => {
    const id = ++idRef.current;
    const text = typeof msg === "string" ? msg : String(msg ?? "");
    setToasts((prev) => [...prev.slice(-2), { id, msg: text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_TTL_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
