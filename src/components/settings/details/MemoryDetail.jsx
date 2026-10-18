/* MemoryDetail — ChatGPT-style memory page + migration prompt + "Add memory". */
import { useState } from "react";
import { Plus, Trash2, Copy, Database } from "lucide-react";
import { useSettings } from "../../../state/SettingsContext.jsx";
import { useToast } from "../../../state/ToastContext.jsx";

const MIGRATION_PROMPT = `I-export ang memory mo mula sa ChatGPT:
1. Buksan ang ChatGPT → Settings → Personalization → Memory
2. Kopyahin ang bawat memory entry
3. I-paste dito gamit ang "Add memory" sa ibaba
Para sa buong chat history, gamitin ang Import Chats (.zip) sa Settings.`;

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `mem-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

export default function MemoryDetail() {
  const { settings, updateSetting } = useSettings();
  const { toast } = useToast();
  const [summary, setSummary] = useState(settings.memorySummary || "");
  const [draft, setDraft] = useState("");

  const memories = Array.isArray(settings.memories) ? settings.memories : [];

  const saveSummary = () => {
    updateSetting("memorySummary", summary.slice(0, 4000));
    toast("Na-save ang memory summary");
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_PROMPT);
      toast("Na-kopya ang migration guide");
    } catch {
      toast("Hindi ma-kopya — paki-select nang mano-mano");
    }
  };

  const addMemory = () => {
    const t = draft.trim();
    if (!t) return;
    updateSetting("memories", [...memories, { id: uid(), text: t.slice(0, 500), at: Date.now() }]);
    setDraft("");
    toast("Na-save ang memory");
  };

  const removeMemory = (id) => {
    updateSetting("memories", memories.filter((m) => m.id !== id));
    toast("Nabura ang memory");
  };

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <h3>
          <Database size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Memory summary
        </h3>
        <p>Buod ng mga alam ni JepongDevxyz AI tungkol sa iyo.</p>
        <div className="jd-field">
          <textarea
            className="jd-textarea"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Hal. Developer mula sa Pilipinas, gumagawa ng Android apps…"
            maxLength={4000}
          />
        </div>
        <button type="button" className="jd-btn jd-btn--primary" onClick={saveSummary}>
          I-save ang summary
        </button>
      </div>

      <div className="jd-card">
        <h3>Migration mula sa ibang AI</h3>
        <p style={{ whiteSpace: "pre-line" }}>{MIGRATION_PROMPT}</p>
        <button type="button" className="jd-btn" onClick={copyPrompt}>
          <Copy size={15} /> Kopyahin ang guide
        </button>
      </div>

      <div className="jd-card">
        <h3>Add memory</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="jd-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Hal. Gusto ko ng maikling sagot palagi"
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter") addMemory();
            }}
            aria-label="New memory"
          />
          <button type="button" className="jd-btn jd-btn--primary" onClick={addMemory} aria-label="Add memory">
            <Plus size={16} />
          </button>
        </div>
        {memories.length === 0 ? (
          <p>Wala pang naka-save na memory.</p>
        ) : (
          memories.map((m) => (
            <div key={m.id} className="jd-memory-item">
              <span>{m.text}</span>
              <button
                type="button"
                className="jd-icon-btn"
                onClick={() => removeMemory(m.id)}
                aria-label="Delete memory"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
