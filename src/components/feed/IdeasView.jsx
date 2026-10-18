/* IdeasView — Phase 4 (checklist E34). Idea cards + save/star.
   Naka-persist sa localStorage (jai_ideas_v1). */
import { useEffect, useState } from "react";
import { Plus, Lightbulb, Star, Trash2, MessageCircle } from "lucide-react";
import { useToast } from "../../state/ToastContext.jsx";
import Sheet from "../ui/Sheet.jsx";
import "./feed.css";

const LS_IDEAS = "jai_ideas_v1";

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) ?? fallback : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key, v) {
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
    return `i-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}
function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export default function IdeasView() {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState(() => readLS(LS_IDEAS, []));
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => writeLS(LS_IDEAS, ideas), [ideas]);

  const save = () => {
    const t = title.trim();
    if (!t) {
      toast("Lagyan ng title ang idea");
      return;
    }
    setIdeas((p) => [
      { id: uid(), title: t.slice(0, 120), body: body.trim().slice(0, 2000), starred: false, at: Date.now() },
      ...p,
    ]);
    setTitle("");
    setBody("");
    setFormOpen(false);
    toast("Na-save ang idea");
  };

  const toggleStar = (id) =>
    setIdeas((p) => p.map((i) => (i.id === id ? { ...i, starred: !i.starred } : i)));

  const remove = (id) => {
    setIdeas((p) => p.filter((i) => i.id !== id));
    toast("Nabura ang idea");
  };

  const discuss = (idea) => {
    window.dispatchEvent(
      new CustomEvent("jd:open-chat-prompt", {
        detail: { prompt: `Pag-usapan natin ang idea kong ito:\n\n${idea.title}\n${idea.body}` },
      })
    );
  };

  const sorted = [...ideas].sort((a, b) => {
    if (!!a.starred !== !!b.starred) return a.starred ? -1 : 1;
    return b.at - a.at;
  });

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
          <Lightbulb size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
          Ideas · {ideas.length}
        </div>
        <button type="button" className="jd-btn jd-btn--primary" onClick={() => setFormOpen(true)}>
          <Plus size={14} /> Bagong idea
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="jd-card" style={{ textAlign: "center", padding: "28px 16px" }}>
          <Lightbulb size={30} style={{ color: "var(--faint)", marginBottom: 8 }} />
          <p style={{ margin: "0 0 12px" }}>Wala pang idea. I-save ang unang idea mo!</p>
          <button type="button" className="jd-btn jd-btn--primary" onClick={() => setFormOpen(true)}>
            <Plus size={14} /> Bagong idea
          </button>
        </div>
      ) : (
        sorted.map((idea) => (
          <div className="jd-idea" key={idea.id}>
            <div className="jd-idea__title">{idea.title}</div>
            {idea.body ? <div className="jd-idea__body">{idea.body}</div> : null}
            <div className="jd-idea__foot">
              <span className="jd-idea__date">{fmtDate(idea.at)}</span>
              <span style={{ display: "flex", gap: 4 }}>
                <button
                  type="button"
                  className="jd-icon-btn"
                  onClick={() => toggleStar(idea.id)}
                  aria-label={idea.starred ? "Unstar" : "Star"}
                  title={idea.starred ? "Unstar" : "Star"}
                  style={idea.starred ? { color: "var(--accent)" } : null}
                >
                  <Star size={16} fill={idea.starred ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  className="jd-icon-btn"
                  onClick={() => discuss(idea)}
                  aria-label="Discuss sa chat"
                  title="Discuss sa chat"
                >
                  <MessageCircle size={16} />
                </button>
                <button
                  type="button"
                  className="jd-icon-btn"
                  onClick={() => remove(idea.id)}
                  aria-label="Burahin ang idea"
                  title="Burahin"
                >
                  <Trash2 size={16} />
                </button>
              </span>
            </div>
          </div>
        ))
      )}

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title="Bagong idea">
        <div className="jd-field">
          <label htmlFor="jd-idea-title">Title</label>
          <input
            id="jd-idea-title"
            className="jd-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="hal. App para sa sari-sari store inventory"
            maxLength={120}
          />
        </div>
        <div className="jd-field">
          <label htmlFor="jd-idea-body">Detalye (opsiyonal)</label>
          <textarea
            id="jd-idea-body"
            className="jd-textarea"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ilarawan ang idea…"
          />
        </div>
        <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={save}>
          <Plus size={15} /> I-save ang idea
        </button>
      </Sheet>
    </div>
  );
}
