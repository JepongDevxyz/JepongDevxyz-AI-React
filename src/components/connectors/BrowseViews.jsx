/* BrowseViews — Phase 4 (checklist H52).
   - Browse view: search + group filter chips + grid ng connectors
   - Use view: detail ng connector (description, Connect, "Gamitin sa chat")
   - Agent Browse stack: naka-gate sa settings.agentBrowse (Extra toggle);
     browse tasks (URL + goal) na naka-save sa localStorage; Steel-backed
     kapag may backend, mock-tolerant kapag wala
   - Approval Cards UI: approve/deny list (naka-persist) */
import { useEffect, useMemo, useState } from "react";
import { Search, ArrowLeft, Check, X, Globe2, Plus, ShieldCheck } from "lucide-react";
import { useToast } from "../../state/ToastContext.jsx";
import { useSettings } from "../../state/SettingsContext.jsx";
import { CONNECTOR_CATALOG, GROUPS } from "./catalog.js";
import { steelRequest } from "../../api/connectors.js";
import Sheet from "../ui/Sheet.jsx";
import "./connectors.css";

const LS_TASKS = "jai_browse_tasks_v1"; // [{id, url, goal, status, at}]
const LS_APPROVALS = "jai_approvals_v1"; // [{id, title, detail, status: pending|approved|denied, at}]

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
    return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function initials(name) {
  const parts = String(name).split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function BrowseViews({ view = "browse" }) {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Lahat");
  const [useEntry, setUseEntry] = useState(null); // Use view (Sheet)
  const [tasks, setTasks] = useState(() => readJSON(LS_TASKS, []));
  const [approvals, setApprovals] = useState(() => readJSON(LS_APPROVALS, []));
  const [taskUrl, setTaskUrl] = useState("");
  const [taskGoal, setTaskGoal] = useState("");
  const [running, setRunning] = useState(null);

  useEffect(() => writeJSON(LS_TASKS, tasks), [tasks]);
  useEffect(() => writeJSON(LS_APPROVALS, approvals), [approvals]);

  /* ---------- Browse / Filter ---------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONNECTOR_CATALOG.filter((c) => {
      if (group !== "Lahat" && c.group !== group) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.blurb.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [query, group]);

  const handleUseInChat = (entry) => {
    setUseEntry(null);
    window.dispatchEvent(
      new CustomEvent("jd:open-chat-prompt", {
        detail: {
          prompt: `Gusto kong gamitin ang ${entry.name} connector (${entry.blurb}). Tulungan mo akong i-set up ito at ipaliwanag kung paano ito gagamitin sa chat.`,
        },
      })
    );
  };

  /* ---------- Agent Browse stack ---------- */
  const agentOn = !!settings.agentBrowse;

  const addTask = () => {
    const url = taskUrl.trim();
    if (!url) {
      toast("Ilagay ang URL na iba-browse");
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      toast("Ang URL ay dapat nagsisimula sa http(s)://");
      return;
    }
    setTasks((p) => [
      { id: uid(), url, goal: taskGoal.trim() || "I-browse ang page", status: "queued", at: Date.now() },
      ...p,
    ]);
    setTaskUrl("");
    setTaskGoal("");
    toast("Nadagdag sa Agent Browse stack");
  };

  const runTask = async (task) => {
    setRunning(task.id);
    setTasks((p) => p.map((t) => (t.id === task.id ? { ...t, status: "running" } : t)));
    try {
      const r = await steelRequest("/browse", {
        method: "POST",
        body: JSON.stringify({ url: task.url, goal: task.goal }),
      });
      if (r.ok && r.backend !== false) {
        setTasks((p) =>
          p.map((t) =>
            t.id === task.id
              ? { ...t, status: "done", result: r.data?.summary || "Tapos (tingnan ang server logs)" }
              : t
          )
        );
        toast("Tapos ang browse task");
      } else {
        // Mock-tolerant: walang backend → markahan bilang needs-backend
        setTasks((p) =>
          p.map((t) =>
            t.id === task.id ? { ...t, status: "needs-backend" } : t
          )
        );
        toast("Walang /api/steel backend — naka-queue ang task");
      }
    } finally {
      setRunning(null);
    }
  };

  const removeTask = (id) => setTasks((p) => p.filter((t) => t.id !== id));

  /* ---------- Approval Cards ---------- */
  const decide = (id, status) => {
    setApprovals((p) => p.map((a) => (a.id === id ? { ...a, status } : a)));
    toast(status === "approved" ? "Na-approve" : "Na-deny");
  };

  // Seed: unang bukas, isang halimbawang approval card (para makita ang UI)
  useEffect(() => {
    setApprovals((p) => {
      if (p.length > 0) return p;
      try {
        if (localStorage.getItem("jai_approvals_seeded") === "1") return p;
        localStorage.setItem("jai_approvals_seeded", "1");
      } catch {
        /* ignore */
      }
      return [
        {
          id: uid(),
          title: "Agent Browse: buksan ang URL",
          detail:
            "Hihingi ng permiso ang Agent Browse bago buksan ang panlabas na URL sa ngalan mo. I-approve para payagan, i-deny para harangin.",
          status: "pending",
          at: Date.now(),
        },
      ];
    });
  }, []);

  if (view === "approvals") {
    const pending = approvals.filter((a) => a.status === "pending");
    const decided = approvals.filter((a) => a.status !== "pending");
    return (
      <div>
        <div className="jd-conn-group__label" style={{ marginBottom: 8 }}>
          <ShieldCheck size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
          Approval Cards · {pending.length} pending
        </div>
        {pending.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Walang pending na approval.</p>
        ) : (
          pending.map((a) => (
            <div className="jd-approval" key={a.id}>
              <div className="jd-approval__title">{a.title}</div>
              <div className="jd-approval__detail">{a.detail}</div>
              <div className="jd-approval__actions">
                <button
                  type="button"
                  className="jd-btn jd-btn--primary"
                  onClick={() => decide(a.id, "approved")}
                >
                  <Check size={14} /> Approve
                </button>
                <button type="button" className="jd-btn" onClick={() => decide(a.id, "denied")}>
                  <X size={14} /> Deny
                </button>
              </div>
            </div>
          ))
        )}
        {decided.length > 0 ? (
          <>
            <div className="jd-conn-group__label" style={{ margin: "14px 0 8px" }}>
              History
            </div>
            {decided.map((a) => (
              <div className="jd-approval" key={a.id}>
                <div className="jd-approval__title">{a.title}</div>
                <div className={`jd-approval__status is-${a.status}`}>
                  {a.status === "approved" ? "Approved" : "Denied"}
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    );
  }

  /* ---------- Browse + Agent stack (default view) ---------- */
  return (
    <div>
      {/* Agent Browse stack — naka-gate sa Extra toggle */}
      <div className="jd-conn-group">
        <div className="jd-conn-group__label">
          <Globe2 size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
          Agent Browse stack {agentOn ? "" : "(naka-off)"}
        </div>
        {!agentOn ? (
          <div className="jd-card">
            <p>
              Naka-off ang <strong>Agent Browse (beta)</strong>. Buksan ito sa
              Settings → Extra para magamit ang browse stack.
            </p>
          </div>
        ) : (
          <>
            <div className="jd-card">
              <div className="jd-field">
                <label htmlFor="jd-bt-url">URL</label>
                <input
                  id="jd-bt-url"
                  className="jd-input"
                  value={taskUrl}
                  onChange={(e) => setTaskUrl(e.target.value)}
                  placeholder="https://example.com"
                  inputMode="url"
                />
              </div>
              <div className="jd-field">
                <label htmlFor="jd-bt-goal">Goal (opsiyonal)</label>
                <input
                  id="jd-bt-goal"
                  className="jd-input"
                  value={taskGoal}
                  onChange={(e) => setTaskGoal(e.target.value)}
                  placeholder="hal. kunin ang presyo ng produkto"
                />
              </div>
              <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={addTask}>
                <Plus size={15} /> Idagdag sa stack
              </button>
            </div>
            {tasks.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Walang naka-queue na browse task.</p>
            ) : (
              tasks.map((t) => (
                <div className="jd-browse-task" key={t.id}>
                  <div className="jd-browse-task__url" title={t.url}>
                    {t.url}
                  </div>
                  <div className="jd-browse-task__meta">
                    {t.goal} · {t.status}
                    {t.result ? ` — ${t.result}` : ""}
                  </div>
                  <div className="jd-approval__actions" style={{ marginTop: 8 }}>
                    {t.status === "queued" || t.status === "needs-backend" ? (
                      <button
                        type="button"
                        className="jd-btn"
                        onClick={() => runTask(t)}
                        disabled={running === t.id}
                      >
                        {running === t.id ? "Tumatakbo…" : "I-run"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="jd-icon-btn"
                      aria-label="Tanggalin ang task"
                      onClick={() => removeTask(t.id)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Browse / Filter */}
      <div className="jd-conn-group__label">Browse connectors</div>
      <div className="jd-field" style={{ position: "relative" }}>
        <Search
          size={15}
          style={{ position: "absolute", left: 12, top: 12, color: "var(--faint)" }}
        />
        <input
          className="jd-input"
          style={{ paddingLeft: 34 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hanapin ang connector…"
          aria-label="Search connectors"
        />
      </div>
      <div className="jd-conn-filter" role="tablist" aria-label="Filter by group">
        {["Lahat", ...GROUPS].map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={group === g}
            className={group === g ? "is-active" : ""}
            onClick={() => setGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="jd-conn-grid">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            className="jd-conn-card"
            onClick={() => setUseEntry(c)}
            style={{ textAlign: "left", width: "100%" }}
          >
            <span className="jd-conn-card__icon" aria-hidden="true">
              {initials(c.name)}
            </span>
            <div className="jd-conn-card__meta">
              <div className="jd-conn-card__name">{c.name}</div>
              <div className="jd-conn-card__blurb">{c.group}</div>
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>Walang nahanap.</p>
      ) : null}

      {/* Use view */}
      <Sheet open={!!useEntry} onClose={() => setUseEntry(null)} title={useEntry?.name || "Connector"}>
        {useEntry ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span className="jd-conn-card__icon" aria-hidden="true" style={{ width: 46, height: 46 }}>
                {initials(useEntry.name)}
              </span>
              <div>
                <div style={{ fontWeight: 700 }}>{useEntry.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {useEntry.group} · {useEntry.kind === "oauth" ? "OAuth" : useEntry.kind === "apikey" ? "API key" : "Custom"}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{useEntry.blurb}</p>
            <div className="jd-approval__actions">
              <button type="button" className="jd-btn jd-btn--primary" onClick={() => handleUseInChat(useEntry)}>
                Gamitin sa chat
              </button>
              <button type="button" className="jd-btn" onClick={() => setUseEntry(null)}>
                <ArrowLeft size={14} /> Bumalik
              </button>
            </div>
            <p className="jd-usage-note">
              Ang aktwal na pag-connect ay ginagawa sa Connect tab (OAuth) o sa API-key form
              (Credential Vault).
            </p>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}
