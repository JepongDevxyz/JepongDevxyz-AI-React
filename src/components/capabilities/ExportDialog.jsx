/* ExportDialog — artifacts export.
   Source: Paste text / Huling reply / Composer text / Buong chat.
   Format: HTML, Markdown, TXT → direktang download (laging available).
   XLSX / DOCX / PPTX → via backend /api/export KUNG available; kung wala,
   malinaw na fallback sa HTML + Markdown + TXT (hindi nagpapanggap). */
import { useState } from "react";
import { Download, Server, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import { useChat } from "../../state/ChatContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import { peekComposerText } from "../chat/Composer.jsx";

const ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const API_BASE = String(ENV.VITE_API_BASE || "").replace(/\/$/, "");

const SOURCES = [
  { id: "paste", label: "Paste text" },
  { id: "last", label: "Huling reply" },
  { id: "composer", label: "Composer text" },
  { id: "chat", label: "Buong chat" },
];

const READY_FORMATS = [
  { id: "html", label: "HTML", desc: "Styled document — direktang download", ready: true },
  { id: "md", label: "Markdown", desc: "Plain .md file — direktang download", ready: true },
  { id: "txt", label: "TXT", desc: "Plain text — direktang download", ready: true },
];

const SERVER_FORMATS = [
  { id: "xlsx", label: "XLSX", desc: "Excel spreadsheet", ready: false },
  { id: "docx", label: "DOCX", desc: "Word document", ready: false },
  { id: "pptx", label: "PPTX", desc: "PowerPoint slides", ready: false },
];

function sanitizeFilename(title, ext) {
  let t = String(title || "export").trim() || "export";
  t = t.replace(/[\\/:*?"<>|#%{}&]/g, "").replace(/\s+/g, " ").trim();
  if (t.length > 80) t = t.slice(0, 80).trim();
  return `${t || "export"}.${ext}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
    try {
      a.remove();
    } catch {
      /* ignore */
    }
  }, 4000);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(title, content) {
  const t = escapeHtml(title || "Export");
  const body = escapeHtml(content || "");
  return `<!DOCTYPE html>
<html lang="tl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<style>body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;color:#1a1a1a;background:#fff;line-height:1.7}h1{font-size:1.5rem;border-bottom:2px solid #eee;padding-bottom:12px}pre{white-space:pre-wrap;word-break:break-word;font-family:inherit}footer{margin-top:40px;color:#888;font-size:.8rem;border-top:1px solid #eee;padding-top:12px}</style>
</head><body><h1>${t}</h1><pre>${body}</pre><footer>Ginawa sa JepongDevxyz AI</footer></body></html>`;
}

export default function ExportDialog({ onClose }) {
  const { toast } = useToast();
  const { messages } = useChat();
  const [source, setSource] = useState("paste");
  const [pasted, setPasted] = useState("");
  const [title, setTitle] = useState("");
  const [serverState, setServerState] = useState({}); // formatId -> 'working'|'ok'|'fail'
  const [serverFailed, setServerFailed] = useState(false);

  const contentFor = (src) => {
    if (src === "paste") return pasted;
    if (src === "composer") return peekComposerText();
    if (src === "chat") {
      return messages
        .map((m) => `${m.role === "user" ? "Ikaw" : "JepongDevxyz AI"}: ${m.content || ""}`)
        .join("\n\n");
    }
    // last reply
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.content);
    return last ? last.content : "";
  };

  const content = contentFor(source);
  const hasContent = content.trim().length > 0;

  const doReadyExport = (format) => {
    if (!hasContent) {
      toast("Walang laman na ie-export");
      return;
    }
    const fname = sanitizeFilename(title || "export", format === "md" ? "md" : format);
    if (format === "html") {
      downloadBlob(new Blob([buildHtml(title || "Export", content)], { type: "text/html" }), fname);
    } else if (format === "md") {
      downloadBlob(new Blob([content], { type: "text/markdown" }), fname);
    } else {
      downloadBlob(new Blob([content], { type: "text/plain" }), fname);
    }
    toast(`Nada-download: ${fname}`);
  };

  const doServerExport = async (format) => {
    if (!hasContent) {
      toast("Walang laman na ie-export");
      return;
    }
    setServerState((p) => ({ ...p, [format]: "working" }));
    try {
      const res = await fetch(`${API_BASE}/api/export`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          title: title || "export",
          content,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error("Walang laman ang server response");
      downloadBlob(blob, sanitizeFilename(title || "export", format));
      setServerState((p) => ({ ...p, [format]: "ok" }));
      toast(`Nada-download ang ${format.toUpperCase()}`);
    } catch {
      setServerState((p) => ({ ...p, [format]: "fail" }));
      setServerFailed(true);
      toast(`${format.toUpperCase()}: hindi available ang server — gamitin ang HTML/Markdown/TXT`);
    }
  };

  return (
    <Modal open onClose={onClose} title="Export">
      <div className="jd-cap-stack">
        <div className="jd-cap-subhead">Source</div>
        <div className="jd-cap-seg">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`jd-cap-seg__btn${source === s.id ? " is-active" : ""}`}
              onClick={() => setSource(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {source === "paste" ? (
          <textarea
            className="jd-codearea"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="I-paste ang text na ie-export…"
            aria-label="Text na ie-export"
            rows={5}
          />
        ) : (
          <div className="jd-cap-preview">
            {hasContent ? (
              <>{content.slice(0, 400)}{content.length > 400 ? "…" : ""}</>
            ) : (
              <span className="jd-cap-empty">Walang laman ang source na ito.</span>
            )}
          </div>
        )}

        <input
          className="jd-cap-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Pangalan ng file (optional)"
          maxLength={80}
          aria-label="Pangalan ng file"
        />

        <div className="jd-cap-subhead">
          <CheckCircle2 size={15} className="jd-step-ic--done" /> Laging available
        </div>
        <div className="jd-cap-stack jd-cap-stack--tight">
          {READY_FORMATS.map((f) => (
            <button key={f.id} type="button" className="jd-tool-row" onClick={() => doReadyExport(f.id)}>
              <span className="jd-tool-row__icon"><Download size={19} /></span>
              <span className="jd-tool-row__text">
                <span className="jd-tool-row__label">
                  {f.label} <span className="jd-badge jd-badge--ok">ready</span>
                </span>
                <span className="jd-tool-row__desc">{f.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="jd-cap-subhead">
          <Server size={15} /> Kailangan ng server <code>/api/export</code>
        </div>
        <div className="jd-cap-stack jd-cap-stack--tight">
          {SERVER_FORMATS.map((f) => {
            const st = serverState[f.id];
            return (
              <button
                key={f.id}
                type="button"
                className="jd-tool-row"
                onClick={() => doServerExport(f.id)}
                disabled={st === "working"}
              >
                <span className="jd-tool-row__icon"><Download size={19} /></span>
                <span className="jd-tool-row__text">
                  <span className="jd-tool-row__label">
                    {f.label}{" "}
                    <span className={`jd-badge ${st === "fail" ? "jd-badge--warn" : "jd-badge--muted"}`}>
                      {st === "working" ? "…" : st === "ok" ? "ok" : st === "fail" ? "hindi available" : "via server"}
                    </span>
                  </span>
                  <span className="jd-tool-row__desc">{f.desc}</span>
                </span>
                {st === "working" ? <Loader2 size={16} className="jd-spin" /> : null}
              </button>
            );
          })}
        </div>

        {serverFailed ? (
          <div className="jd-cap-warning">
            <AlertTriangle size={15} />
            <span>
              Hindi nakita ang <code>/api/export</code> sa server — ang XLSX/DOCX/PPTX
              ay hindi gumagana ngayon. Gamitin ang HTML, Markdown, o TXT sa itaas
              (laging gumagana, walang server na kailangan).
            </span>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
