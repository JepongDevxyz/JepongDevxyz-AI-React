/* vfs.js — virtual file system ng FileEditor (localStorage).
   Key: jai_vfs_v1 → { [name]: { content, mimeType, updatedAt } }.
   Ang mga text attachment mula sa chat ay naka-register bilang "chat/<name>"
   para mabuksan/ma-edit mula sa chat attachment chips. */

const LS_KEY = "jai_vfs_v1";
const MAX_TEXT_BYTES = 100 * 1024; // 100KB cap sa localStorage

function readStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const j = raw ? JSON.parse(raw) : {};
    return j && typeof j === "object" ? j : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* quota — tahimik */
  }
}

export function sanitizeName(name) {
  let t = String(name || "untitled.txt").trim() || "untitled.txt";
  t = t.replace(/[\\/:*?"<>|#%{}&]/g, "").replace(/\s+/g, " ").trim();
  if (t.length > 80) t = t.slice(0, 80).trim();
  return t || "untitled.txt";
}

export function listFiles() {
  const store = readStore();
  return Object.keys(store)
    .map((name) => ({ name, ...store[name] }))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getFile(name) {
  const store = readStore();
  const f = store[name];
  return f ? { name, ...f } : null;
}

export function saveFile(name, content, mimeType) {
  const n = sanitizeName(name);
  if (!n) return null;
  const store = readStore();
  store[n] = {
    content: String(content ?? ""),
    mimeType: mimeType || guessMime(n),
    updatedAt: Date.now(),
  };
  writeStore(store);
  return n;
}

export function deleteFile(name) {
  const store = readStore();
  if (!(name in store)) return false;
  delete store[name];
  writeStore(store);
  return true;
}

export function downloadFile(name) {
  const f = getFile(name);
  if (!f) return false;
  const blob = new Blob([f.content], { type: f.mimeType || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.includes("/") ? name.split("/").pop() : name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
    try {
      a.remove();
    } catch {
      /* ignore */
    }
  }, 4000);
  return true;
}

export function guessMime(name) {
  const n = String(name || "").toLowerCase();
  if (n.endsWith(".html") || n.endsWith(".htm")) return "text/html";
  if (n.endsWith(".md") || n.endsWith(".markdown")) return "text/markdown";
  if (n.endsWith(".json")) return "application/json";
  if (n.endsWith(".js") || n.endsWith(".jsx")) return "text/javascript";
  if (n.endsWith(".css")) return "text/css";
  if (n.endsWith(".csv")) return "text/csv";
  return "text/plain";
}

export function isTextEditable({ name, mimeType } = {}) {
  const m = String(mimeType || "");
  if (m.startsWith("text/") || m === "application/json" || m === "text/markdown") return true;
  return /\.(txt|md|markdown|js|jsx|ts|tsx|json|html|htm|css|csv|xml|log)$/i.test(
    String(name || "")
  );
}

function base64ToText(b64) {
  const bin = atob(String(b64 || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  try {
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return bin;
  }
}

export function chatFileName(name) {
  return `chat/${sanitizeName(name)}`;
}

/* I-register ang text attachments mula sa chat sa VFS (para sa "Edit" action).
   rawAtts: [{name, mimeType, data(base64)}] — bago ang prepareAttachments. */
export function registerChatFiles(rawAtts = []) {
  const list = Array.isArray(rawAtts) ? rawAtts : [];
  const store = readStore();
  let changed = false;
  for (const a of list) {
    if (!a || !a.data || !isTextEditable(a)) continue;
    try {
      const approxBytes = Math.floor(String(a.data).length * 0.75);
      if (approxBytes > MAX_TEXT_BYTES) continue;
      const text = base64ToText(a.data);
      const n = chatFileName(a.name);
      store[n] = { content: text, mimeType: a.mimeType || "text/plain", updatedAt: Date.now() };
      changed = true;
    } catch {
      /* skip unreadable */
    }
  }
  if (changed) writeStore(store);
}
