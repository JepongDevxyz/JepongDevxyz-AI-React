/* notifications.js — Phase 4. Central notification sink (read-only UI sa
   NotificationCenter). Pinagmumulan: goal reminders, battery warnings,
   proactive nudges. Naka-persist sa localStorage; "jd:notifications" event
   para sa badge updates. */

const LS_NOTIFS = "jai_notifications_v1";
const MAX = 100;

function readLS() {
  try {
    const raw = localStorage.getItem(LS_NOTIFS);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeLS(list) {
  try {
    localStorage.setItem(LS_NOTIFS, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}
function emit() {
  try {
    window.dispatchEvent(new CustomEvent("jd:notifications"));
  } catch {
    /* ignore */
  }
}
function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `n-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

/** Magdagdag ng notification. type: goal|battery|proactive|system */
export function pushNotification({ type = "system", title, body = "" }) {
  if (!title) return null;
  const list = readLS();
  const n = { id: uid(), type, title: String(title), body: String(body), at: Date.now(), read: false };
  writeLS([n, ...list]);
  emit();
  return n.id;
}

export function listNotifications() {
  return readLS();
}

export function unreadCount() {
  return readLS().filter((n) => !n.read).length;
}

export function markAllRead() {
  const list = readLS().map((n) => ({ ...n, read: true }));
  writeLS(list);
  emit();
}

export function clearNotifications() {
  writeLS([]);
  emit();
}
