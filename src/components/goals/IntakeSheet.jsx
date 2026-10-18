/* IntakeSheet — Phase 4. Sheet para sa bagong goal:
   title + description + reminder (datetime). */
import { useState } from "react";
import { Target } from "lucide-react";
import Sheet from "../ui/Sheet.jsx";
import { useToast } from "../../state/ToastContext.jsx";

function toLocalInput(ts) {
  try {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default function IntakeSheet({ open, onClose, onCreate }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminder, setReminder] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setReminder("");
  };

  const submit = () => {
    const t = title.trim();
    if (!t) {
      toast("Lagyan ng title ang goal");
      return;
    }
    let reminderAt = null;
    if (reminder) {
      const ts = new Date(reminder).getTime();
      if (!Number.isNaN(ts)) reminderAt = ts;
    }
    onCreate?.({ title: t, description: description.trim(), reminderAt });
    reset();
    onClose?.();
    toast("Nagawa ang goal");
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose?.();
      }}
      title="Bagong goal"
    >
      <div className="jd-field">
        <label htmlFor="jd-goal-title">Title</label>
        <input
          id="jd-goal-title"
          className="jd-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="hal. Matutong mag-React"
          maxLength={120}
        />
      </div>
      <div className="jd-field">
        <label htmlFor="jd-goal-desc">Description (opsiyonal)</label>
        <textarea
          id="jd-goal-desc"
          className="jd-textarea"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ano ang gusto mong ma-achieve?"
        />
      </div>
      <div className="jd-field">
        <label htmlFor="jd-goal-rem">Reminder (opsiyonal)</label>
        <input
          id="jd-goal-rem"
          className="jd-input"
          type="datetime-local"
          value={reminder}
          min={toLocalInput(Date.now())}
          onChange={(e) => setReminder(e.target.value)}
        />
      </div>
      <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={submit}>
        <Target size={15} /> Gumawa ng goal
      </button>
    </Sheet>
  );
}
