/* NotificationCenter — Phase 4 (checklist E35).
   READ-ONLY central sink: goal reminders, battery warnings, proactive nudges.
   Bubukas via "jd:open-notifications" event. */
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bell, Target, Battery, Sparkles, Info, CheckCheck, Trash2 } from "lucide-react";
import { useToast } from "../../state/ToastContext.jsx";
import {
  listNotifications,
  markAllRead,
  clearNotifications,
} from "./notifications.js";
import "./extras.css";

const TYPE_ICON = {
  goal: Target,
  battery: Battery,
  proactive: Sparkles,
  system: Info,
};

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "ngayon lang";
  if (s < 3600) return `${Math.floor(s / 60)}m nakalipas`;
  if (s < 86400) return `${Math.floor(s / 3600)}h nakalipas`;
  return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function openNotifications() {
  window.dispatchEvent(new CustomEvent("jd:open-notifications"));
}

export default function NotificationCenter({ onClose }) {
  const { toast } = useToast();
  const [items, setItems] = useState(() => listNotifications());

  const refresh = useCallback(() => setItems(listNotifications()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("jd:notifications", refresh);
    return () => window.removeEventListener("jd:notifications", refresh);
  }, [refresh]);

  const doMarkAll = () => {
    markAllRead();
    refresh();
    toast("Nabasa na lahat");
  };

  const doClear = () => {
    clearNotifications();
    refresh();
    toast("Na-clear ang notifications");
  };

  return (
    <div className="jd-notif-overlay" role="dialog" aria-modal="true" aria-label="Notifications">
      <div className="jd-notif__head">
        <button type="button" className="jd-icon-btn" aria-label="Bumalik" onClick={onClose}>
          <ArrowLeft size={20} />
        </button>
        <span className="jd-notif__title">Notifications</span>
        <button
          type="button"
          className="jd-icon-btn"
          aria-label="Markahan lahat bilang nabasa"
          title="Markahan lahat bilang nabasa"
          onClick={doMarkAll}
        >
          <CheckCheck size={18} />
        </button>
        <button
          type="button"
          className="jd-icon-btn"
          aria-label="I-clear lahat"
          title="I-clear lahat"
          onClick={doClear}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="jd-notif__list">
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}>
            <Bell size={32} style={{ color: "var(--faint)", marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>
              Walang notifications. Dito lalabas ang goal reminders, battery warnings, at
              proactive nudges.
            </p>
          </div>
        ) : (
          items.map((n) => {
            const Icon = TYPE_ICON[n.type] || Info;
            return (
              <div className={`jd-notif${n.read ? "" : " is-unread"}`} key={n.id}>
                <span className="jd-notif__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className="jd-notif__meta">
                  <div className="jd-notif__title">{n.title}</div>
                  {n.body ? <div className="jd-notif__body">{n.body}</div> : null}
                  <div className="jd-notif__time">{timeAgo(n.at)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
