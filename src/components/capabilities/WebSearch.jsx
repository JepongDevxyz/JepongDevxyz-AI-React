/* WebSearch — web search panel.
   Query → POST /api/chat na may web_search instruction (streamChat webSearch).
   Results na may citations (title + URL + snippet mula sa markdown links);
   "Ipadala sa chat" action (summary + citations sa composer). */
import { useState } from "react";
import { Search, Loader2, AlertTriangle, RotateCcw, Send, ExternalLink } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Shimmer from "../ui/Shimmer.jsx";
import { MarkdownLite } from "../chat/Message.jsx";
import { streamChat } from "../../api/chat.js";
import { pushComposerDraft } from "../chat/Composer.jsx";
import { useToast } from "../../state/ToastContext.jsx";

function extractResults(text) {
  const out = [];
  const seen = new Set();
  const lines = String(text || "").split("\n");
  const re = /\[([^\]]{1,140})\]\((https?:\/\/[^\s)]+)\)/;
  lines.forEach((line) => {
    const m = re.exec(line);
    if (!m) return;
    const url = m[2].trim();
    if (seen.has(url)) return;
    seen.add(url);
    // snippet: ang line na walang markdown link syntax
    const snippet = line.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1").trim();
    out.push({ title: m[1].trim() || url, url, snippet: snippet.slice(0, 220) });
  });
  return out;
}

export default function WebSearch({ onClose }) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState([]);
  const [connError, setConnError] = useState(false);

  const search = async () => {
    const q = query.trim();
    if (!q || running) return;
    setRunning(true);
    setConnError(false);
    setAnswer("");
    setResults([]);

    let acc = "";
    let err = null;
    try {
      await streamChat({
        messages: [
          {
            role: "user",
            content:
              `Mag-web search tungkol sa: ${q}. Ibigay ang sagot na may citations ` +
              `bilang markdown links [title](url) — bawat mahalagang claim ay may source.`,
          },
        ],
        mode: "ask",
        webSearch: true,
        onToken: (t) => {
          acc += t;
          setAnswer(acc);
        },
        onError: (e) => {
          err = e;
        },
      });
    } catch (e) {
      err = e;
    }

    if (err) {
      setConnError(true);
      toast(String((err && err.message) || "Hindi makapag-search"));
    } else {
      setResults(extractResults(acc));
    }
    setRunning(false);
  };

  const insertToChat = () => {
    const q = query.trim();
    if (!q) return;
    const lines = [`Web search: ${q}`, ""];
    if (answer.trim()) lines.push(answer.trim().slice(0, 2500), "");
    if (results.length) {
      lines.push("Sources:");
      results.slice(0, 10).forEach((r, i) => lines.push(`${i + 1}. [${r.title}](${r.url})`));
    }
    pushComposerDraft(lines.join("\n"));
    toast("Nailagay ang search results sa composer");
    onClose?.();
  };

  return (
    <Modal open onClose={onClose} title="Web Search" wide>
      <div className="jd-cap-stack">
        <div className="jd-cap-addrow">
          <input
            className="jd-cap-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") search();
            }}
            placeholder="Ano ang hahanapin sa web?"
            maxLength={300}
            aria-label="Search query"
            disabled={running}
          />
          <button
            type="button"
            className="jd-cap-btn"
            onClick={search}
            disabled={running || !query.trim()}
          >
            {running ? <Loader2 size={16} className="jd-spin" /> : <Search size={16} />}
            {running ? "Naghahanap…" : "Search"}
          </button>
        </div>

        {connError ? (
          <div className="jd-cap-warning">
            <AlertTriangle size={15} />
            <span>
              Kailangan ng koneksyon sa backend — hindi maabot ang <code>/api/chat</code>.
            </span>
            <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={search}>
              <RotateCcw size={15} /> Subukan ulit
            </button>
          </div>
        ) : null}

        {running && !answer ? <Shimmer lines={3} variant="chat" /> : null}

        {answer ? (
          <div className="jd-research-report">
            <MarkdownLite text={answer} />
          </div>
        ) : null}

        {results.length > 0 ? (
          <>
            <div className="jd-cap-subhead">Citations ({results.length})</div>
            <div className="jd-cap-list jd-cap-list--compact">
              {results.map((r, i) => (
                <a
                  key={`${r.url}-${i}`}
                  className="jd-cite-row"
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="jd-cite-row__n">{i + 1}</span>
                  <span className="jd-cite-row__body">
                    <span className="jd-cite-row__t">
                      {r.title} <ExternalLink size={12} />
                    </span>
                    {r.snippet ? <span className="jd-cite-row__s">{r.snippet}</span> : null}
                    <span className="jd-cite-row__u">{r.url}</span>
                  </span>
                </a>
              ))}
            </div>
            <div className="jd-cap-row">
              <button type="button" className="jd-cap-btn" onClick={insertToChat}>
                <Send size={15} /> Ipadala sa chat
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
