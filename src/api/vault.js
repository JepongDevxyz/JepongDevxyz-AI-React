/* vault.js — AES-GCM-256 encrypted Credential Vault (WebCrypto, walang deps).
   Storage: localStorage "jai_vault_v1" = { salt, check, entries: [{id, service, iv, ct, createdAt}] }
   - Passphrase → PBKDF2-SHA256 100k → AES-GCM-256 key (in-memory lang, hindi naka-store).
   - setProviderConfigured() mula models.js ang nagbubukas ng ModelPicker gating (Phase 2).
   - getCredential(service): ginagamit ng ModelPicker availability gating. */
import { setProviderConfigured } from "./models.js";

const LS_VAULT = "jai_vault_v1";
const PBKDF2_ITERS = 100000;

let sessionKey = null; // CryptoKey | null — in-memory lang

function subtle() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new Error("WebCrypto subtle is not available");
  return c.subtle;
}

function b64encode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

const te = new TextEncoder();
const td = new TextDecoder();

function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `v-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function readStore() {
  try {
    const raw = localStorage.getItem(LS_VAULT);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object" || !o.salt || !Array.isArray(o.entries))
      return null;
    return o;
  } catch {
    return null;
  }
}

function writeStore(o) {
  localStorage.setItem(LS_VAULT, JSON.stringify(o));
}

async function deriveKey(passphrase, saltBytes) {
  const base = await subtle().importKey(
    "raw",
    te.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle().deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: PBKDF2_ITERS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptWith(key, plaintext) {
  const iv = randomBytes(12);
  const ct = await subtle().encrypt({ name: "AES-GCM", iv }, key, te.encode(plaintext));
  return { iv: b64encode(iv), ct: b64encode(new Uint8Array(ct)) };
}

async function decryptWith(key, ivB64, ctB64) {
  const pt = await subtle().decrypt(
    { name: "AES-GCM", iv: b64decode(ivB64) },
    key,
    b64decode(ctB64)
  );
  return td.decode(pt);
}

/* ---------- public API ---------- */

export function isVaultInitialized() {
  return !!readStore();
}

export function isUnlocked() {
  return !!sessionKey;
}

export function lockVault() {
  sessionKey = null;
}

/* Gumawa ng bagong vault (first run). */
export async function initVault(passphrase) {
  const pw = String(passphrase || "");
  if (pw.length < 4) throw new Error("Passphrase must be at least 4 characters");
  const salt = randomBytes(16);
  const key = await deriveKey(pw, salt);
  const check = await encryptWith(key, "jepongdevxyz-vault-check");
  writeStore({
    salt: b64encode(salt),
    check,
    entries: [],
  });
  sessionKey = key;
  return true;
}

/* Buksan ang vault; false kapag maling passphrase. */
export async function unlockVault(passphrase) {
  const store = readStore();
  if (!store) throw new Error("Vault is not initialized");
  const key = await deriveKey(String(passphrase || ""), b64decode(store.salt));
  try {
    const probe = await decryptWith(key, store.check.iv, store.check.ct);
    if (probe !== "jepongdevxyz-vault-check") return false;
  } catch {
    return false;
  }
  sessionKey = key;
  return true;
}

/* Metadata lang — walang plaintext. */
export function listCredentials() {
  const store = readStore();
  if (!store) return [];
  return store.entries
    .map((e) => ({ id: e.id, service: e.service, createdAt: e.createdAt }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function requireKey() {
  if (!sessionKey) throw new Error("Vault is locked");
  return sessionKey;
}

export async function saveCredential(service, secret) {
  const key = requireKey();
  const svc = String(service || "").trim().toLowerCase();
  const sec = String(secret || "");
  if (!svc) throw new Error("Service name is required");
  if (!sec) throw new Error("API key is required");
  const store = readStore();
  if (!store) throw new Error("Vault is not initialized");
  const { iv, ct } = await encryptWith(key, sec);
  const idx = store.entries.findIndex((e) => e.service === svc);
  const entry = {
    id: idx >= 0 ? store.entries[idx].id : uid(),
    service: svc,
    iv,
    ct,
    createdAt: idx >= 0 ? store.entries[idx].createdAt : Date.now(),
  };
  if (idx >= 0) store.entries[idx] = entry;
  else store.entries.push(entry);
  writeStore(store);
  // Buksan ang ModelPicker gating para sa provider na ito (Phase 2)
  try {
    setProviderConfigured(svc, true);
  } catch {
    /* models.js flag unavailable */
  }
  return entry.id;
}

export async function deleteCredential(id) {
  requireKey();
  const store = readStore();
  if (!store) return false;
  const entry = store.entries.find((e) => e.id === id);
  store.entries = store.entries.filter((e) => e.id !== id);
  writeStore(store);
  if (entry) {
    try {
      setProviderConfigured(entry.service, false);
    } catch {
      /* ignore */
    }
  }
  return true;
}

/* FILL_SECRET-style: nagbabalik ng plaintext, hindi naglo-log. */
export async function getCredential(service) {
  const key = requireKey();
  const store = readStore();
  if (!store) return null;
  const svc = String(service || "").trim().toLowerCase();
  const entry = store.entries.find((e) => e.service === svc);
  if (!entry) return null;
  try {
    return await decryptWith(key, entry.iv, entry.ct);
  } catch {
    return null;
  }
}

/* Masked preview para sa listahan (hindi ang tunay na key). */
export function maskPreview(service) {
  const s = String(service || "");
  return `••••••••${s.slice(-0)}`.slice(0, 12);
}

export function wipeVault() {
  try {
    localStorage.removeItem(LS_VAULT);
  } catch {
    /* ignore */
  }
  sessionKey = null;
}
