/* ThoughtsSheet.jsx — expandable sheet ng activity/thinking steps
   habang nag-stream (amber dot + neutral text). */
import { useState } from "react";
import { Brain, Check, Loader2, AlertTriangle } from "lucide-react";
import { useChat } from "../../state/ChatContext.jsx";
import Sheet from "../ui/Sheet.jsx";

function StepIcon({ state }) {
  if (state === "completed") return <Check size={14} color="#22c55e" />;
  if (state === "warning") return <AlertTriangle size={14} color="#f59e0b" />;
  return <Loader2 size={14} className="jd-spin" color="#f59e0b" />;
}

export default function ThoughtsSheet() {
  const { activitySteps, activityStatus, isStreaming } = useChat();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="jd-mini-toggle"
        type="button"
        onClick={() => setOpen(true)}
        title="Tingnan ang thinking steps"
      >
        <Brain />
        Thoughts{activitySteps.length ? ` (${activitySteps.length})` : ""}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Thoughts">
        {isStreaming && activityStatus ? (
          <div className="jd-activity-line">
            <span className="jd-status-dot" aria-hidden="true" />
            <span className="jd-thinking">{activityStatus.label}</span>
          </div>
        ) : null}
        {activitySteps.length === 0 ? (
          <div className="jd-thought-empty">
            Walang thinking steps sa ngayon. Lalabas dito ang bawat hakbang habang nag-iisip ang AI.
          </div>
        ) : (
          <div>
            {activitySteps.map((s) => (
              <div className="jd-thought-step" key={s.id}>
                <StepIcon state={s.state} />
                <span className="jd-thought-step__label">{s.label}</span>
                {s.kind ? <span className="jd-thought-step__kind">{s.kind}</span> : null}
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </>
  );
}
