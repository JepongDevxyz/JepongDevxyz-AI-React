/* NotificationBell — Phase 4. Bell icon na may unread badge.
   Ilalagay sa sidebar footer (may puwang doon, consistent sa lahat ng shells).
   I-click → "jd:open-notifications". */
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { unreadCount } from "./notifications.js";
import { openNotifications } from "./NotificationCenter.jsx";
import "./extras.css";

export default function NotificationBell() {
  const [unread, setUnread] = useState(() => unreadCount());

  useEffect(() => {
    const refresh = () => setUnread(unreadCount());
    refresh();
    window.addEventListener("jd:notifications", refresh);
    return () => window.removeEventListener("jd:notifications", refresh);
  }, []);

  return (
    <button
      type="button"
      className="jd-icon-btn jd-bell"
      aria-label={`Notifications${unread ? `, ${unread} hindi pa nababasa` : ""}`}
      title="Notifications"
      onClick={openNotifications}
    >
      <Bell size={17} strokeWidth={1.9} />
      {unread > 0 ? (
        <span className="jd-bell__badge">{unread > 99 ? "99+" : unread}</span>
      ) : null}
    </button>
  );
}
