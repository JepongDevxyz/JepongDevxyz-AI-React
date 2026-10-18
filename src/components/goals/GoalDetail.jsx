/* GoalDetail — Phase 4. Detail view ng isang goal:
   progress slider, threads, reminder, "Let's do it" → nagbubukas ng chat
   na may goal context (via "jd:goal-chat" event → App bridge). */
import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  MessageCircle,
  Plus,
  Bell,
  Check,
  MessageSquareText,
} from "lucide-react";
import { useToast } from "../../state/ToastContext.jsx";
import "./goals.css";

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function GoalDetail({
  goal,
  onBack,
  onDelete,
  onSetProgress,
  onToggleDone,
  onAddThread,
  onSetReminder,
}) {
  const { toast } = useToast();
  const [threadTitle, setThreadTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!goal) return null;

  const letsDoIt = () => {
    window.dispatchEvent(
      new CustomEvent("jd:goal-chat", {
        detail: {
          goalId: goal.id,
          title: goal.title,
          description: goal.description,
        },
      })
    );
  };

  const addThread = () => {
    const t = threadTitle.trim();
    if (!t) {
      toast("Lagyan ng title ang thread");
      return;
    }
    onAddThread?.(goal.id, t);
    setThreadTitle("");
    toast("Nadagdag ang thread");
  };

  const doDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.(goal.id);
  };

  return (
    <div className="jd-detail">
      <button
        type="button"
        className="jd-btn"
        onClick={onBack}
        style={{ alignSelf: "flex-start" }}
      >
        <ArrowLeft size={15} /> Bumalik sa goals
      </button>

      <div className="jd-card jd-goal-hero">
        <h3>{goal.title}</h3>
        {goal.description ? <p>{goal.description}</p> : null}
        <div className="jd-goal-card__meta">
          <span>{goal.done ? "Tapos na" : "Aktibo"}</span>
          {goal.reminderAt ? (
            <span>
              <Bell size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
              {fmtDate(goal.reminderAt)}
            </span>
          ) : null}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 13 }}>Progress</strong>
            <span className="jd-goal-pct">{goal.progress}%</span>
          </div>
          <div className="jd-goal-progress">
            <div className="jd-goal-progress__fill" style={{ width: `${goal.progress}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={goal.progress}
            onChange={(e) => onSetProgress?.(goal.id, Number(e.target.value))}
            className="jd-range"
            aria-label="Goal progress"
          />
        </div>

        <div className="jd-approval__actions" style={{ marginTop: 6 }}>
          <button type="button" className="jd-btn jd-btn--primary" onClick={letsDoIt}>
            <MessageCircle size={15} /> Let&apos;s do it
          </button>
          <button type="button" className="jd-btn" onClick={() => onToggleDone?.(goal.id)}>
            <Check size={15} /> {goal.done ? "Buksan ulit" : "Markahan tapos"}
          </button>
        </div>
      </div>

      {/* Reminder */}
      <div className="jd-card">
        <h3>
          <Bell size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Reminder
        </h3>
        <div className="jd-approval__actions">
          <input
            type="datetime-local"
            className="jd-input"
            style={{ flex: 1 }}
            value={goal.reminderAt ? toLocal(goal.reminderAt) : ""}
            onChange={(e) => {
              const ts = new Date(e.target.value).getTime();
              onSetReminder?.(goal.id, Number.isNaN(ts) ? null : ts);
            }}
            aria-label="Goal reminder"
          />
          {goal.reminderAt ? (
            <button
              type="button"
              className="jd-btn"
              onClick={() => onSetReminder?.(goal.id, null)}
            >
              Alisin
            </button>
          ) : null}
        </div>
        <p className="jd-usage-note">
          Lalabas ang reminder sa Notification Center kapag dumating ang oras.
        </p>
      </div>

      {/* Threads */}
      <div className="jd-card">
        <h3>
          <MessageSquareText size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Threads ({(goal.threads || []).length})
        </h3>
        {(goal.threads || []).length === 0 ? (
          <p>Wala pang thread — magdagdag ng sub-topic o milestone.</p>
        ) : (
          (goal.threads || []).map((t) => (
            <div className="jd-thread" key={t.id}>
              <div className="jd-thread__meta">
                <div className="jd-thread__title">{t.title}</div>
                <div className="jd-thread__date">{fmtDate(t.at)}</div>
              </div>
            </div>
          ))
        )}
        <div className="jd-approval__actions" style={{ marginTop: 8 }}>
          <input
            className="jd-input"
            style={{ flex: 1 }}
            value={threadTitle}
            onChange={(e) => setThreadTitle(e.target.value)}
            placeholder="Bagong thread…"
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter") addThread();
            }}
            aria-label="Bagong thread"
          />
          <button type="button" className="jd-btn" onClick={addThread} aria-label="Idagdag ang thread">
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Delete */}
      <button
        type="button"
        className="jd-btn jd-btn--danger jd-btn--block"
        onClick={doDelete}
      >
        <Trash2 size={15} /> {confirmDelete ? "Sigurado? I-tap ulit para burahin" : "Burahin ang goal"}
      </button>
    </div>
  );
}

function toLocal(ts) {
  try {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return "";
  }
}
