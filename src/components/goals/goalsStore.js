/* goalsStore.js — Phase 4. Goals CRUD + reminders (localStorage).
   Schema: { id, title, description, reminderAt|null, progress 0-100,
             threads: [{id, title, at}], done, createdAt } */
import { useCallback, useEffect, useState } from "react";

const LS_GOALS = "jai_goals_v1";
const LS_NOTIFIED = "jai_goals_notified_v1"; // [goalId] na na-notify na

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) ?? fallback : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}
function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `g-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

export function useGoals() {
  const [goals, setGoals] = useState(() => readJSON(LS_GOALS, []));

  useEffect(() => writeJSON(LS_GOALS, goals), [goals]);

  const addGoal = useCallback(({ title, description = "", reminderAt = null }) => {
    const t = String(title || "").trim();
    if (!t) return null;
    const g = {
      id: uid(),
      title: t.slice(0, 120),
      description: String(description || "").slice(0, 2000),
      reminderAt: reminderAt || null,
      progress: 0,
      threads: [],
      done: false,
      createdAt: Date.now(),
    };
    setGoals((p) => [g, ...p]);
    return g.id;
  }, []);

  const updateGoal = useCallback((id, patch) => {
    setGoals((p) => p.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals((p) => p.filter((g) => g.id !== id));
  }, []);

  const setProgress = useCallback((id, pct) => {
    const n = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    setGoals((p) =>
      p.map((g) => (g.id === id ? { ...g, progress: n, done: n >= 100 ? g.done : g.done } : g))
    );
  }, []);

  const toggleDone = useCallback((id) => {
    setGoals((p) =>
      p.map((g) =>
        g.id === id ? { ...g, done: !g.done, progress: !g.done ? 100 : g.progress } : g
      )
    );
  }, []);

  const addThread = useCallback((id, title) => {
    const t = String(title || "").trim();
    if (!t) return;
    setGoals((p) =>
      p.map((g) =>
        g.id === id
          ? { ...g, threads: [...(g.threads || []), { id: uid(), title: t.slice(0, 120), at: Date.now() }] }
          : g
      )
    );
  }, []);

  const setReminder = useCallback((id, reminderAt) => {
    setGoals((p) => p.map((g) => (g.id === id ? { ...g, reminderAt: reminderAt || null } : g)));
  }, []);

  return { goals, addGoal, updateGoal, deleteGoal, setProgress, toggleDone, addThread, setReminder };
}

/* Mga goal na due ang reminder at hindi pa na-notify — para sa NotificationCenter */
export function dueGoalReminders() {
  const goals = readJSON(LS_GOALS, []);
  const notified = readJSON(LS_NOTIFIED, []);
  const now = Date.now();
  const due = goals.filter(
    (g) => !g.done && g.reminderAt && g.reminderAt <= now && !notified.includes(g.id)
  );
  return due;
}

export function markGoalNotified(id) {
  const notified = readJSON(LS_NOTIFIED, []);
  if (!notified.includes(id)) writeJSON(LS_NOTIFIED, [...notified, id]);
}
