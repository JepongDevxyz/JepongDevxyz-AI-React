/* TodosPanel — todo list: add/edit/delete/check, localStorage persist,
   "Ipadala sa chat" (naglalagay ng summary sa composer). */
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, Send, X } from "lucide-react";
import Sheet from "../ui/Sheet.jsx";
import { pushComposerDraft } from "../chat/Composer.jsx";
import { useToast } from "../../state/ToastContext.jsx";

const LS_KEY = "jai_todos_v1";

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `t-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function TodosPanel({ onClose }) {
  const { toast } = useToast();
  const [todos, setTodos] = useState(load);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(todos));
    } catch {
      /* storage unavailable */
    }
  }, [todos]);

  const add = () => {
    const t = input.trim();
    if (!t) return;
    setTodos((prev) => [...prev, { id: uid(), text: t, done: false, createdAt: Date.now() }]);
    setInput("");
  };

  const toggle = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id) => setTodos((prev) => prev.filter((t) => t.id !== id));

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditingText(t.text);
  };

  const commitEdit = () => {
    const t = editingText.trim();
    if (!t) {
      setEditingId(null);
      return;
    }
    setTodos((prev) => prev.map((x) => (x.id === editingId ? { ...x, text: t } : x)));
    setEditingId(null);
    setEditingText("");
  };

  const clearDone = () => setTodos((prev) => prev.filter((t) => !t.done));

  const sendToChat = () => {
    if (!todos.length) {
      toast("Walang todos na ipapadala");
      return;
    }
    const open = todos.filter((t) => !t.done);
    const done = todos.filter((t) => t.done);
    const lines = ["Mga todo ko:"];
    open.forEach((t) => lines.push(`- [ ] ${t.text}`));
    done.forEach((t) => lines.push(`- [x] ${t.text}`));
    pushComposerDraft(lines.join("\n"));
    toast("Nailagay ang todos sa composer");
    onClose?.();
  };

  const openCount = todos.filter((t) => !t.done).length;

  return (
    <Sheet open onClose={onClose} title={`Todos (${openCount} bukas)`}>
      <div className="jd-cap-addrow">
        <input
          className="jd-cap-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Magdagdag ng todo…"
          maxLength={300}
          aria-label="Bagong todo"
        />
        <button type="button" className="jd-cap-btn" onClick={add} aria-label="Idagdag">
          <Plus size={18} />
        </button>
      </div>

      <div className="jd-cap-list">
        {todos.length === 0 ? (
          <div className="jd-cap-empty">Walang todos. Magdagdag ka sa itaas.</div>
        ) : (
          todos.map((t) => (
            <div key={t.id} className={`jd-todo-item${t.done ? " is-done" : ""}`}>
              <button
                type="button"
                className={`jd-todo-check${t.done ? " is-done" : ""}`}
                onClick={() => toggle(t.id)}
                aria-label={t.done ? "Markahan bilang bukas" : "Markahan bilang tapos"}
              >
                {t.done ? <Check size={14} /> : null}
              </button>
              {editingId === t.id ? (
                <input
                  className="jd-cap-input jd-cap-input--sm"
                  value={editingText}
                  autoFocus
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={commitEdit}
                  aria-label="I-edit ang todo"
                />
              ) : (
                <span className="jd-todo-text">{t.text}</span>
              )}
              <button
                type="button"
                className="jd-cap-iconbtn"
                onClick={() => startEdit(t)}
                aria-label="I-edit"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                className="jd-cap-iconbtn jd-cap-iconbtn--danger"
                onClick={() => remove(t.id)}
                aria-label="Tanggalin"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="jd-cap-foot">
        <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={clearDone}>
          Linisin ang tapos
        </button>
        <button type="button" className="jd-cap-btn" onClick={sendToChat}>
          <Send size={15} /> Ipadala sa chat
        </button>
        <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={onClose} aria-label="Isara">
          <X size={15} />
        </button>
      </div>
    </Sheet>
  );
}
