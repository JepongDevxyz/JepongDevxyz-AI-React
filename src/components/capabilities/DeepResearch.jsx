/* DeepResearch — multi-step research panel:
   (a) bumubuo ng 3 research angles mula sa query,
   (b) bawat angle: POST /api/chat na may web_search (streamChat),
   (c) steps UI (searching → reading → synthesizing) na may Shimmer,
   (d) final synthesized report na may citations.
   Kapag hindi maabot ang backend: graceful "kailangan ng koneksyon" state. */
import { useState } from "react";
import { Search, Copy, Send, Loader2, AlertTriangle, RotateCcw, CheckCircle2 } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Shimmer from "../ui/Shimmer.jsx";
import { MarkdownLite } from "../chat/Message.jsx";
import { streamChat } from "../../api/chat.js";
import { useChat } from "../../state/ChatContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";

function extractCitations(text) {
  const out = [];
  const seen = new Set();
  const re = /\[([^\]]{1,120})\]\((https?:\/\/[^\s)]+)\)/g;
  let m;
  while ((m = re.exec(String(text || "")))) {
    const url = m[2].trim();
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ title: m[1].trim() || url, url });
  }
  return out;
}

function anglesFor(q) {
  const t = q.trim();
  return [
    `${t} — overview at key facts`,
    `${t} — pinakabagong balita at developments`,
    `${t} — expert analysis at practical implications`,
  ];
}

async function chatOnce(content, { webSearch = false, onToken } = {}) {
  let acc = "";
  let err = null;
  await streamChat({
    messages: [{ role: "user", content }],
    mode: "ask",
    webSearch,
    onToken: (t) => {
      acc += t;
      onToken?.(acc);
    },
    onError: (e) => {
      err = e;
    },
  });
  if (err) throw err;
  return acc;
}

export default function DeepResearch({ onClose }) {
  const { toast } = useToast();
  const { sendMessage } = useChat();
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState([]); // {label, state: active|done|error}
  const [report, setReport] = useState("");
  const [citations, setCitations] = useState([]);
  const [connError, setConnError] = useState(false);

  const setStepState = (idx, state) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, state } : s)));

  const run = async () => {
    const q = query.trim();
    if (!q || running) return;
    setRunning(true);
    setConnError(false);
    setReport("");
    setCitations([]);
    const angles = anglesFor(q);
    const stepList = angles.map((a) => ({ label: `Naghahanap: ${a}`, state: "active" }));
    stepList.push({ label: "Nagsi-synthesize ng final report…", state: "pending" });
    setSteps(stepList);

    try {
      const findings = [];
      for (let i = 0; i < angles.length; i++) {
        setStepState(i, "active");
        const text = await chatOnce(
          `Research this thoroughly USING WEB SEARCH. Bigay ang key findings na may sources bilang markdown links [title](url): ${angles[i]}`,
          { webSearch: true }
        );
        findings.push({ angle: angles[i], text });
        const cites = extractCitations(text);
        if (cites.length) setCitations((prev) => [...prev, ...cites]);
        setStepState(i, "done");
      }

      setStepState(angles.length, "active");
      const merged = findings
        .map((f, i) => `### Angle ${i + 1}: ${f.angle}\n${f.text}`)
        .join("\n\n");
      const final = await chatOnce(
        `Gumawa ng malinaw na research report (match the language of this query: "${q}"). ` +
          `I-synthesize ang findings sa ibaba sa isang structured report na may headings, ` +
          `key takeaways, at Sources section (markdown links). Huwag mag-imbento ng sources.\n\n${merged}`,
        {
          webSearch: false,
          onToken: (acc) => setReport(acc),
        }
      );
      setReport(final);
      setStepState(angles.length, "done");
    } catch (e) {
      const msg = String((e && e.message) || e || "");
      setSteps((prev) => prev.map((s) => (s.state === "active" ? { ...s, state: "error" } : s)));
      setConnError(true);
      toast(msg || "Hindi natapos ang research");
    } finally {
      setRunning(false);
    }
  };

  const copyReport = async () => {
    const cites = citations.map((c, i) => `${i + 1}. [${c.title}](${c.url})`).join("\n");
    const full = `# Research: ${query.trim()}\n\n${report}\n\n## Sources\n${cites}`;
    try {
      await navigator.clipboard.writeText(full);
      toast("Kinopya ang report");
    } catch {
      toast("Hindi makopya sa device na ito");
    }
  };

  const sendToChat = () => {
    if (!report.trim()) return;
    sendMessage(`Research report tungkol sa "${query.trim()}":\n\n${report.slice(0, 4000)}`);
    toast("Ipinadala sa chat ang report");
    onClose?.();
  };

  return (
    <Modal open onClose={onClose} title="Deep Research" wide>
      <div className="jd-cap-stack">
        <div className="jd-cap-addrow">
          <input
            className="jd-cap-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            placeholder="Ano ang gusto mong i-research nang malalim?"
            maxLength={300}
            aria-label="Research query"
            disabled={running}
          />
          <button type="button" className="jd-cap-btn" onClick={run} disabled={running || !query.trim()}>
            {running ? <Loader2 size={16} className="jd-spin" /> : <Search size={16} />}
            {running ? "Nagre-research…" : "Research"}
          </button>
        </div>

        {connError ? (
          <div className="jd-cap-warning">
            <AlertTriangle size={15} />
            <span>
              Kailangan ng koneksyon sa backend — hindi maabot ang <code>/api/chat</code>.
              Suriin ang internet o ang API base, tapos subukan ulit.
            </span>
            <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={run}>
              <RotateCcw size={15} /> Subukan ulit
            </button>
          </div>
        ) : null}

        {steps.length > 0 ? (
          <div className="jd-research-steps">
            {steps.map((s, i) => (
              <div key={i} className={`jd-research-step jd-research-step--${s.state}`}>
                {s.state === "done" ? (
                  <CheckCircle2 size={15} className="jd-step-ic--done" />
                ) : s.state === "active" ? (
                  <Loader2 size={15} className="jd-spin" />
                ) : s.state === "error" ? (
                  <AlertTriangle size={15} className="jd-step-ic--error" />
                ) : (
                  <span className="jd-step-dot" />
                )}
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {running && !report ? <Shimmer lines={3} variant="chat" /> : null}

        {report ? (
          <div className="jd-research-report">
            <MarkdownLite text={report} />
          </div>
        ) : null}

        {citations.length > 0 ? (
          <div className="jd-cap-subhead">Sources ({citations.length})</div>
        ) : null}
        {citations.length > 0 ? (
          <div className="jd-cap-list jd-cap-list--compact">
            {citations.slice(0, 30).map((c, i) => (
              <a
                key={`${c.url}-${i}`}
                className="jd-cite-row"
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="jd-cite-row__n">{i + 1}</span>
                <span className="jd-cite-row__t">{c.title}</span>
              </a>
            ))}
          </div>
        ) : null}

        {report ? (
          <div className="jd-cap-row">
            <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={copyReport}>
              <Copy size={15} /> Kopyahin
            </button>
            <button type="button" className="jd-cap-btn" onClick={sendToChat}>
              <Send size={15} /> Ipadala sa chat
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
