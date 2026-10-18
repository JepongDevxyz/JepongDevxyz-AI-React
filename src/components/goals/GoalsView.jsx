/* GoalsView — Phase 4. Goals list + intake sheet + detail view.
   Ginagamit sa Explore → Goals tab. */
import { useState } from "react";
import { Plus, Target, Bell } from "lucide-react";
import { useGoals } from "./goalsStore.js";
import IntakeSheet from "./IntakeSheet.jsx";
import GoalDetail from "./GoalDetail.jsx";
import "./goals.css";

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function GoalsView() {
  const {
    goals,
    addGoal,
    deleteGoal,
    setProgress,
    toggleDone,
    addThread,
    setReminder,
  } = useGoals();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const active = goals.find((g) => g.id === activeId) || null;

  const handleDelete = (id) => {
    deleteGoal(id);
    setActiveId(null);
  };

  if (active) {
    return (
      <GoalDetail
        goal={active}
        onBack={() => setActiveId(null)}
        onDelete={handleDelete}
        onSetProgress={setProgress}
        onToggleDone={toggleDone}
        onAddThread={addThread}
        onSetReminder={setReminder}
      />
    );
  }

  const open = goals.filter((g) => !g.done);
  const done = goals.filter((g) => g.done);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div className="jd-conn-group__label" style={{ margin: 0 }}>
          <Target size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
          Goals · {open.length} aktibo
        </div>
        <button
          type="button"
          className="jd-btn jd-btn--primary"
          onClick={() => setIntakeOpen(true)}
        >
          <Plus size={14} /> Bagong goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="jd-card" style={{ textAlign: "center", padding: "28px 16px" }}>
          <Target size={30} style={{ color: "var(--faint)", marginBottom: 8 }} />
          <p style={{ margin: "0 0 12px" }}>Wala pang goal. Gumawa ng una mong goal!</p>
          <button
            type="button"
            className="jd-btn jd-btn--primary"
            onClick={() => setIntakeOpen(true)}
          >
            <Plus size={14} /> Gumawa ng goal
          </button>
        </div>
      ) : (
        <>
          {open.map((g) => (
            <button
              key={g.id}
              type="button"
              className="jd-goal-card"
              onClick={() => setActiveId(g.id)}
            >
              <div className="jd-goal-card__title">{g.title}</div>
              {g.description ? <div className="jd-goal-card__desc">{g.description}</div> : null}
              <div className="jd-goal-progress">
                <div className="jd-goal-progress__fill" style={{ width: `${g.progress}%` }} />
              </div>
              <div className="jd-goal-card__meta">
                <span className="jd-goal-pct">{g.progress}%</span>
                {(g.threads || []).length > 0 ? <span>{g.threads.length} threads</span> : null}
                {g.reminderAt ? (
                  <span>
                    <Bell size={11} style={{ verticalAlign: -1, marginRight: 2 }} />
                    {fmtDate(g.reminderAt)}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
          {done.length > 0 ? (
            <>
              <div className="jd-conn-group__label" style={{ margin: "14px 0 8px" }}>
                Tapos na · {done.length}
              </div>
              {done.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="jd-goal-card is-done"
                  onClick={() => setActiveId(g.id)}
                >
                  <div className="jd-goal-card__title">{g.title}</div>
                  <div className="jd-goal-card__meta">
                    <span className="jd-goal-pct">100%</span>
                  </div>
                </button>
              ))}
            </>
          ) : null}
        </>
      )}

      <IntakeSheet
        open={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        onCreate={addGoal}
      />
    </div>
  );
}
