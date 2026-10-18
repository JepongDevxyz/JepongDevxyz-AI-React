/* CreditsContext — Phase 4.
   - balance: naka-persist sa localStorage (jai_credits_v1); sine-sync sa
     GET /api/credits kapag may backend (VITE_API_BASE override; relative default)
   - usage: per-day + per-model (local, jai_usage_v1)
   - deductEstimate(n, modelId): optimistic local deduct habang walang server
   - guest quota: 100/day (jai_guest_quota_v1)
   - welcome 500 credits: one-time claim flag
   - Nakikinig sa "jdpay:paid" (galing sa TopUpModal) → fetchBalance() */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const LS_CREDITS = "jai_credits_v1";
const LS_USAGE = "jai_usage_v1";
const LS_GUEST = "jai_guest_quota_v1";

export const GUEST_DAILY_QUOTA = 100;
export const WELCOME_CREDITS = 500;
export const ESTIMATED_COST_PER_MESSAGE = 10;

const API_BASE = () =>
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  "";

function apiUrl(path) {
  const base = String(API_BASE()).replace(/\/$/, "");
  return `${base}${path}`;
}

function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v === null || v === undefined ? fallback : v;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function authHeaders() {
  const h = { "Content-Type": "application/json" };
  try {
    const t = localStorage.getItem("jai_auth_token");
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* ignore */
  }
  return h;
}

const CreditsContext = createContext(null);

export function CreditsProvider({ children }) {
  const [balance, setBalance] = useState(() => {
    const saved = readJSON(LS_CREDITS, null);
    return typeof saved?.balance === "number" ? saved.balance : null;
  });
  const [welcomeClaimed, setWelcomeClaimed] = useState(() => {
    const saved = readJSON(LS_CREDITS, null);
    return saved?.welcomeClaimed === true;
  });
  const [usage, setUsage] = useState(() => readJSON(LS_USAGE, { days: {} }));
  const [guest, setGuest] = useState(() => {
    const g = readJSON(LS_GUEST, null);
    const today = dayKey();
    if (g && g.day === today) return g;
    return { day: today, used: 0 };
  });
  const [syncing, setSyncing] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* Persist */
  useEffect(() => {
    writeJSON(LS_CREDITS, { balance, welcomeClaimed, updatedAt: Date.now() });
  }, [balance, welcomeClaimed]);
  useEffect(() => {
    writeJSON(LS_USAGE, usage);
  }, [usage]);
  useEffect(() => {
    writeJSON(LS_GUEST, guest);
  }, [guest]);

  /* GET /api/credits — server ang source of truth kapag may backend */
  const fetchBalance = useCallback(async () => {
    setSyncing(true);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(apiUrl("/api/credits"), {
        headers: authHeaders(),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const b = data && (data.balance ?? data?.credits?.balance);
      if (typeof b === "number" && mounted.current) {
        setBalance(b);
        if (data?.usage) {
          // opsyonal na server usage merge (hindi ino-overwrite ang local days)
          setUsage((prev) => ({
            days: { ...(prev.days || {}), ...(data.usage.days || {}) },
          }));
        }
        return b;
      }
      return null;
    } catch {
      /* walang backend — manatili sa local */
      return null;
    } finally {
      if (mounted.current) setSyncing(false);
    }
  }, []);

  /* Optimistic local deduct (estimate) + usage log per model */
  const deductEstimate = useCallback((n = ESTIMATED_COST_PER_MESSAGE, modelId = "unknown") => {
    const cost = Math.max(0, Number(n) || 0);
    const dk = dayKey();
    setBalance((prev) => (typeof prev === "number" ? Math.max(0, prev - cost) : prev));
    setUsage((prev) => {
      const days = { ...(prev.days || {}) };
      const d = { total: 0, models: {}, ...(days[dk] || {}) };
      d.total = (d.total || 0) + cost;
      d.models = { ...(d.models || {}) };
      d.models[modelId] = (d.models[modelId] || 0) + cost;
      days[dk] = d;
      // panatilihin lang ang huling 30 araw
      const keys = Object.keys(days).sort();
      while (keys.length > 30) delete days[keys.shift()];
      return { days };
    });
  }, []);

  /* Guest quota */
  const guestLeft = Math.max(0, GUEST_DAILY_QUOTA - (guest.used || 0));
  const consumeGuest = useCallback((n = 1) => {
    const today = dayKey();
    setGuest((prev) => {
      const base = prev.day === today ? prev : { day: today, used: 0 };
      return { day: today, used: Math.min(GUEST_DAILY_QUOTA, (base.used || 0) + n) };
    });
  }, []);

  /* Welcome 500 — one-time */
  const claimWelcome = useCallback(() => {
    let granted = false;
    setWelcomeClaimed((prev) => {
      if (prev) return prev;
      granted = true;
      return true;
    });
    // i-grant pagkatapos ng state flip (idempotent dahil sa flag)
    setBalance((prev) => {
      if (!granted) return prev;
      return (typeof prev === "number" ? prev : 0) + WELCOME_CREDITS;
    });
    return granted;
  }, []);

  /* Auto-sync sa mount + kapag may nagbayad (jdpay:paid) */
  useEffect(() => {
    fetchBalance();
    const onPaid = () => fetchBalance();
    window.addEventListener("jdpay:paid", onPaid);
    return () => window.removeEventListener("jdpay:paid", onPaid);
  }, [fetchBalance]);

  const value = useMemo(
    () => ({
      balance,
      usage,
      syncing,
      fetchBalance,
      deductEstimate,
      guestUsed: guest.used || 0,
      guestLeft,
      guestQuota: GUEST_DAILY_QUOTA,
      consumeGuest,
      welcomeClaimed,
      claimWelcome,
      welcomeCredits: WELCOME_CREDITS,
    }),
    [
      balance,
      usage,
      syncing,
      fetchBalance,
      deductEstimate,
      guest,
      guestLeft,
      consumeGuest,
      welcomeClaimed,
      claimWelcome,
    ]
  );

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error("useCredits must be used within <CreditsProvider>");
  return ctx;
}
