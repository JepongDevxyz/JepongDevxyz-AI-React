/* uploads.js — attachment upload: presigned-URL flow kapag may backend
   /api/uploads, tahimik na fallback sa base64-local kapag wala.
   Hindi kailanman nag-throw palabas: laging may ibabalik na attachment. */

const ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const API_BASE = String(ENV.VITE_API_BASE || "").replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function base64ToBytes(b64) {
  const bin = atob(String(b64 || "").replace(/\s/g, ""));
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function withTimeout(ms) {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    const c = new AbortController();
    setTimeout(() => {
      try {
        c.abort();
      } catch {
        /* ignore */
      }
    }, ms);
    return c.signal;
  }
}

/* Isang attachment: subukang i-upload via presigned URL; kapag pumalya,
   ibalik ang base64-local na hugis (gaya ng dati — backend pa rin ang bahala). */
async function uploadOne(a) {
  const fallback = () => ({
    name: a.name,
    mimeType: a.mimeType,
    data: a.data || "",
  });
  if (!a || !a.data) return fallback();

  // 1) humingi ng presigned URL sa backend
  const init = await fetch(apiUrl("/api/uploads"), {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: a.name, mimeType: a.mimeType }),
    signal: withTimeout(8000),
  });
  if (!init.ok) return fallback();
  let j = null;
  try {
    j = await init.json();
  } catch {
    return fallback();
  }
  const uploadUrl = j && (j.uploadUrl || j.presignedUrl || j.putUrl);
  if (!uploadUrl) return fallback();
  const fileUrl = j.fileUrl || j.publicUrl || j.key || String(uploadUrl).split("?")[0];

  // 2) i-PUT ang bytes sa presigned URL
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": a.mimeType || "application/octet-stream" },
    body: base64ToBytes(a.data),
    signal: withTimeout(60000),
  });
  if (!put.ok) return fallback();

  return { name: a.name, mimeType: a.mimeType, data: "", url: fileUrl };
}

/* prepareAttachments(atts) — [{name, mimeType, data(base64)}] →
   [{name, mimeType, data, url?}]. Tahimik na fallback sa base64-local. */
export async function prepareAttachments(atts = []) {
  const list = Array.isArray(atts) ? atts : [];
  const out = [];
  for (const a of list) {
    try {
      out.push(await uploadOne(a));
    } catch {
      out.push({ name: a.name, mimeType: a.mimeType, data: a.data || "" });
    }
  }
  return out;
}

/* Diretsong upload ng File object (para sa future use ng Upload tool). */
export async function uploadFileObject(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Hindi mabasa ang file"));
    r.readAsDataURL(file);
  });
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const [one] = await prepareAttachments([
    { name: file.name, mimeType: file.type || "application/octet-stream", data: base64 },
  ]);
  return one;
}
