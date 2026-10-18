/* ProactiveSuite — Phase 4 (checklist E33).
   Morning briefing card, nudges, streaks — lahat localStorage-based at
   naka-schedule via timestamps. Nagre-render ng wala (null); ang output ay
   napupunta sa NotificationCenter (at toast para sa briefing).
   Nire-respeto ang settings: proactiveBriefing / proactiveNudges /
   proactiveStreaks — lahat OFF by default. */
import { useEffect, useRef } from "react";
import { useSettings } from "../../state/SettingsContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import { pushNotification } from "./notifications.js";
import { dueGoalReminders, markGoalNotified } from "../goals/goalsStore.js";

const LS_PRO = "jai_proactive_v1"; // { lastBriefingDay, lastNudgeDay, streakNotified: {3:true,...} }

function readLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_PRO) || "{}") || {};
  } catch {
    return {};
  }
}
function writeLS(v) {
  try {
    localStorage.setItem(LS_PRO, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}
function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function hourNow() {
  return new Date().getHours();
}

/* Streak: sunod-sunod na araw na may chat activity (batay sa sessions) */
function computeStreak() {
  let sessions = [];
  try {
    sessions = JSON.parse(localStorage.getItem("jai_chat_sessions_v1") || "[]") || [];
  } catch {
    sessions = [];
  }
  const days = new Set();
  for (const s of sessions) {
    for (const m of s.messages || []) {
      if (m.at) days.add(dayKey(new Date(m.at)));
    }
    if (s.createdAt) days.add(dayKey(new Date(s.createdAt)));
  }
  let streak = 0;
  const d = new Date();
  // Payagan ang ngayon o kahapon bilang simula (hindi pa tapos ang araw)
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function greeting() {
  const h = hourNow();
  if (h < 12) return "Magandang umaga";
  if (h < 18) return "Magandang hapon";
  return "Magandang gabi";
}

export default function ProactiveSuite() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const timer = useRef(null);

  useEffect(() => {
    const run = () => {
      const state = readLS();
      const today = dayKey();

      /* 1. Goal reminders — laging naka-on (core feature), independent sa toggles */
      try {
        const due = dueGoalReminders();
        for (const g of due) {
          pushNotification({
            type: "goal",
            title: `Reminder: ${g.title}`,
            body: g.description
              ? `${g.description.slice(0, 140)}`
              : "Oras na para magtrabaho sa goal mo.",
          });
          markGoalNotified(g.id);
        }
      } catch {
        /* ignore */
      }

      /* 2. Morning briefing — proactiveBriefing toggle */
      if (settings.proactiveBriefing && state.lastBriefingDay !== today && hourNow() >= 5) {
        let goals = [];
        try {
          goals = JSON.parse(localStorage.getItem("jai_goals_v1") || "[]") || [];
        } catch {
          goals = [];
        }
        const open = goals.filter((g) => !g.done);
        const streak = computeStreak();
        const lines = [
          `${greeting()}, ${settings.userName || "Jepong"}!`,
          open.length
            ? `May ${open.length} kang aktibong goal${open.length > 1 ? "s" : ""} ngayon.`
            : "Wala kang aktibong goal — gusto mo bang gumawa ng isa?",
        ];
        if (streak >= 2) lines.push(`🔥 ${streak}-day streak ka na sa chat!`);
        const body = lines.join(" ");
        pushNotification({ type: "proactive", title: "Morning briefing", body });
        toast(body);
        state.lastBriefingDay = today;
        writeLS(state);
      }

      /* 3. Nudges — proactiveNudges toggle (isang beses kada araw, hapon) */
      if (settings.proactiveNudges && state.lastNudgeDay !== today && hourNow() >= 14) {
        let goals = [];
        try {
          goals = JSON.parse(localStorage.getItem("jai_goals_v1") || "[]") || [];
        } catch {
          goals = [];
        }
        const open = goals.filter((g) => !g.done);
        if (open.length > 0) {
          const g = open[0];
          pushNotification({
            type: "proactive",
            title: "Nudge",
            body: `Kumusta ang "${g.title}"? Kahit 10 minuto ngayon, umuusad ka na.`,
          });
          state.lastNudgeDay = today;
          writeLS(state);
        }
      }

      /* 4. Streaks — proactiveStreaks toggle (milestones 3/7/14/30) */
      if (settings.proactiveStreaks) {
        const streak = computeStreak();
        const notified = state.streakNotified || {};
        for (const m of [3, 7, 14, 30]) {
          if (streak >= m && !notified[m]) {
            pushNotification({
              type: "proactive",
              title: `🔥 ${m}-day streak!`,
              body: `Sunod-sunod na ${m} araw kang nag-chat. Ipagpatuloy mo!`,
            });
            notified[m] = true;
          }
        }
        // I-reset ang milestone flags kapag naputol ang streak
        if (streak === 0 && Object.keys(notified).length) {
          state.streakNotified = {};
        } else {
          state.streakNotified = notified;
        }
        writeLS(state);
      }
    };

    run();
    timer.current = setInterval(run, 60 * 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [settings.proactiveBriefing, settings.proactiveNudges, settings.proactiveStreaks, settings.userName, toast]);

  return null;
}

/* Proactive briefing card — puwedeng i-render sa chat empty state (Phase 5 o App) */
export function briefingCardData() {
  let goals = [];
  try {
    goals = JSON.parse(localStorage.getItem("jai_goals_v1") || "[]") || [];
  } catch {
    goals = [];
  }
  const open = goals.filter((g) => !g.done).slice(0, 3);
  return {
    greeting: greeting(),
    openGoals: open.map((g) => ({ id: g.id, title: g.title, progress: g.progress })),
    streak: computeStreak(),
  };
}
