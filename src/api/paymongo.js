/* paymongo.js — Phase 4 client para sa top-up flow.
   Server endpoints (relative; VITE_API_BASE override):
   - POST /api/paymongo        { tier } → { checkoutUrl, reference }
   - GET  /api/paymongo/status?reference=… → { status: "pending"|"paid"|"expired"|"failed" }
   Tiers (centavos ang pricing sa server): Starter ₱29→1,000 / Pro ₱99→5,000 / Max ₱199→12,000 */

const API_BASE = () =>
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  "";

function apiUrl(path) {
  const base = String(API_BASE()).replace(/\/$/, "");
  return `${base}${path}`;
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

export const TIERS = [
  { id: "starter", label: "Starter", php: 29, credits: 1000, tagline: "Pang-try lang" },
  { id: "pro", label: "Pro", php: 99, credits: 5000, tagline: "Pinakasulit", popular: true },
  { id: "max", label: "Max", php: 199, credits: 12000, tagline: "Para sa heavy use" },
];

export function getTier(id) {
  return TIERS.find((t) => t.id === id) || null;
}

/* POST /api/paymongo → { checkoutUrl, reference } */
export async function createTopUp(tierId) {
  const tier = getTier(tierId);
  if (!tier) throw new Error("Hindi kilalang tier");
  let res;
  try {
    res = await fetch(apiUrl("/api/paymongo"), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tier: tier.id }),
    });
  } catch {
    const e = new Error("Hindi maabot ang payment server (walang backend)");
    e.code = "NO_BACKEND";
    throw e;
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = new Error(data?.error || `Payment error (${res.status})`);
    e.code = "SERVER_ERROR";
    e.status = res.status;
    throw e;
  }
  if (!data?.checkoutUrl || !data?.reference) {
    const e = new Error("Kulang ang sagot ng payment server");
    e.code = "BAD_RESPONSE";
    throw e;
  }
  return { checkoutUrl: data.checkoutUrl, reference: data.reference };
}

/* GET /api/paymongo/status?reference=… → { status } */
export async function pollTopUpStatus(reference) {
  if (!reference) throw new Error("Walang reference");
  let res;
  try {
    res = await fetch(
      apiUrl(`/api/paymongo/status?reference=${encodeURIComponent(reference)}`),
      { headers: authHeaders() }
    );
  } catch {
    const e = new Error("Hindi maabot ang payment server");
    e.code = "NO_BACKEND";
    throw e;
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = new Error(data?.error || `Status error (${res.status})`);
    e.code = "SERVER_ERROR";
    throw e;
  }
  return { status: data?.status || "pending", raw: data };
}
