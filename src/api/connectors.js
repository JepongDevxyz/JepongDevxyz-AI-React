/* connectors.js — Phase 4 client para sa:
   - /api/connectors        (list/status/OAuth/disconnect)
   - /api/steel             (auth headers)
   - /api/plugins           (plugin list)
   Lahat mock-tolerant: kapag walang backend, nagbabalik ng null/[] sa halip
   na mag-throw — ang UI ang magpapakita ng "setup state". */

const API_BASE = () =>
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  "";

function apiUrl(path) {
  const base = String(API_BASE()).replace(/\/$/, "");
  return `${base}${path}`;
}

export function authHeaders(extra = {}) {
  const h = { ...extra };
  try {
    const t = localStorage.getItem("jai_auth_token");
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* ignore */
  }
  return h;
}

async function tryFetch(url, opts = {}) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, status: res.status, data: null };
    const data = await res.json().catch(() => null);
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null, backend: false };
  }
}

/* ---------- /api/connectors ---------- */

/** GET /api/connectors → { connectors: [{id, connected, ...}] } | null kapag walang backend */
export async function listConnectors() {
  const r = await tryFetch(apiUrl("/api/connectors"), {
    headers: authHeaders(),
  });
  if (!r.ok) return null;
  const list = r.data?.connectors || r.data || [];
  return Array.isArray(list) ? list : null;
}

/** GET /api/connectors/:id/status → { connected, … } | null */
export async function connectorStatus(id) {
  const r = await tryFetch(apiUrl(`/api/connectors/${encodeURIComponent(id)}/status`), {
    headers: authHeaders(),
  });
  if (!r.ok) return null;
  return r.data;
}

/** OAuth authorize URL — PKCE flow laban sa /api/connectors (server-side). */
export function connectorOAuthUrl(id, opts = {}) {
  const q = new URLSearchParams();
  if (opts.redirect) q.set("redirect", opts.redirect);
  if (opts.state) q.set("state", opts.state);
  const qs = q.toString();
  return apiUrl(`/api/connectors/${encodeURIComponent(id)}/authorize${qs ? `?${qs}` : ""}`);
}

/** DELETE /api/connectors/:id → true kapag na-disconnect */
export async function disconnectConnector(id) {
  const r = await tryFetch(apiUrl(`/api/connectors/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  return r.ok;
}

/* ---------- Gmail OTP (Signup Agent auto-fetch) ---------- */

/** GET /api/connectors/gmail/otp → { code } — throws {code:"NO_BACKEND"|"NOT_FOUND"} */
export async function gmailLatestOtp(sinceMinutes = 15) {
  const r = await tryFetch(
    apiUrl(`/api/connectors/gmail/otp?since=${encodeURIComponent(sinceMinutes)}`),
    { headers: authHeaders() }
  );
  if (!r.ok && r.backend === false) {
    const e = new Error("Walang backend — hindi ma-fetch ang OTP");
    e.code = "NO_BACKEND";
    throw e;
  }
  const code = r.data?.code || r.data?.otp;
  if (!code) {
    const e = new Error("Walang OTP na nahanap sa Gmail");
    e.code = "NOT_FOUND";
    throw e;
  }
  return { code: String(code) };
}

/** GET /api/connectors/github/repos → [{name, full_name, private}] | null */
export async function githubRepos() {
  const r = await tryFetch(apiUrl("/api/connectors/github/repos"), {
    headers: authHeaders(),
  });
  if (!r.ok) return null;
  const list = r.data?.repos || r.data || [];
  return Array.isArray(list) ? list : null;
}

/* ---------- /api/steel (auth headers) ---------- */

/** Authenticated request sa /api/steel — ginagamit ng Agent Browse stack. */
export async function steelRequest(path, opts = {}) {
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  const r = await tryFetch(apiUrl(`/api/steel${p}`), {
    ...opts,
    headers: authHeaders({ "Content-Type": "application/json", ...(opts.headers || {}) }),
  });
  return r; // { ok, status, data, backend }
}

/** GET /api/steel/health → { ok, keys } | null */
export async function steelHealth() {
  const r = await steelRequest("/health");
  if (!r.ok) return null;
  return r.data;
}

/* ---------- /api/plugins ---------- */

/** GET /api/plugins → { plugins: [...] } | null */
export async function listPlugins() {
  const r = await tryFetch(apiUrl("/api/plugins"), {
    headers: authHeaders(),
  });
  if (!r.ok) return null;
  const list = r.data?.plugins || r.data || [];
  return Array.isArray(list) ? list : null;
}
