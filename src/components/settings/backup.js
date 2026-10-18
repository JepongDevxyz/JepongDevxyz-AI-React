/* backup.js — chat-triggered backup. JSON download via Blob (sapat; walang ZIP lib).
   Confirmation sheet ang UI (Settings → Backup). */
function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}

/* I-download ang lahat ng sessions + settings bilang JSON backup file. */
export function backupChats() {
  const payload = {
    app: "JepongDevxyz AI",
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: readJson("jai_sessions_v1") || [],
    settings: readJson("jai_settings_v1") || {},
    design: null,
    mode: null,
  };
  try {
    payload.design = localStorage.getItem("jai_design");
    payload.mode = localStorage.getItem("jai_mode");
  } catch {
    /* ignore */
  }
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const name = `jepongdevxyz-backup-${stamp()}.json`;
  downloadBlob(blob, name);
  return { name, sessions: payload.sessions.length };
}
