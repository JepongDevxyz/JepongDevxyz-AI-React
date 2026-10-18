/* BatteryMonitor — Phase 4 (checklist E36).
   navigator.getBattery(): warnings sa 20/10/5% (web-only).
   Bawat threshold isang beses lang kada araw; napupunta sa toast +
   Notification Center. Tahimik kapag walang Battery API (fail-open). */
import { useEffect, useRef } from "react";
import { useToast } from "../../state/ToastContext.jsx";
import { pushNotification } from "./notifications.js";

const THRESHOLDS = [20, 10, 5];
const LS_KEY = "jai_battery_warned_v1"; // { day: "2026-10-18", thresholds: [20] }

function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function readWarned() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (v && v.day === dayKey()) return v;
  } catch {
    /* ignore */
  }
  return { day: dayKey(), thresholds: [] };
}
function writeWarned(v) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export default function BatteryMonitor() {
  const { toast } = useToast();
  const toastRef = useRef(null);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    // Web-only: walang Battery API sa ibang platform → fail-open (tahimik)
    if (typeof navigator === "undefined" || typeof navigator.getBattery !== "function") {
      return undefined;
    }
    let battery = null;
    let alive = true;

    const warn = (pct, charging) => {
      const warned = readWarned();
      for (const th of THRESHOLDS) {
        if (pct <= th && !warned.thresholds.includes(th)) {
          warned.thresholds.push(th);
          writeWarned(warned);
          const extra = charging ? "" : " at hindi naka-charge";
          const title = `🪫 ${pct}% na lang ang battery mo${extra}!`;
          const body =
            pct <= 5
              ? "Mag-save ka na ng work mo at i-charge na ang phone para hindi maputol ang session."
              : "I-charge mo na ang phone mo para hindi maputol ang session natin.";
          toastRef.current(title);
          pushNotification({ type: "battery", title, body });
        }
      }
    };

    const check = () => {
      if (!alive || !battery) return;
      const pct = Math.round((battery.level ?? 1) * 100);
      warn(pct, !!battery.charging);
    };

    navigator
      .getBattery()
      .then((b) => {
        if (!alive) return;
        battery = b;
        check();
        b.addEventListener("levelchange", check);
        b.addEventListener("chargingchange", check);
      })
      .catch(() => {
        /* walang access — tahimik */
      });

    return () => {
      alive = false;
      if (battery) {
        battery.removeEventListener("levelchange", check);
        battery.removeEventListener("chargingchange", check);
      }
    };
  }, []);

  return null;
}
