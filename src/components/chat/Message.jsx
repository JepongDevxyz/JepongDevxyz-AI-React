/* Message.jsx — user/assistant bubbles, markdown-lite renderer,
   marker cards (audio/lyrics/map/crew), reactions row. */
import { useCallback, useRef, useState } from "react";
import {
  Copy, Check, Reply, Scissors, Mic, Play, Pause, Music, ExternalLink,
  Users, Volume2, FileText, Pencil,
} from "lucide-react";
import { useToast } from "../../state/ToastContext.jsx";
import { useTools } from "../../state/ToolsContext.jsx";
import { isTextEditable, chatFileName } from "../capabilities/vfs.js";

/* ---------- markdown-lite parser (paragraphs, headers, lists, code, quotes) ---------- */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineFmt(s) {
  let out = escapeHtml(s);
  // bold **x** at __x__
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // italic *x*
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // inline code `x`
  out = out.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  // links [t](u)
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  // autolinks
  out = out.replace(
    /(?<!["'=])(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return out;
}

function renderMarkdownLite(text) {
  const src = String(text || "");
  const blocks = [];
  const lines = src.split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    // fenced code
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", lang, code: codeLines.join("\n"), key: key++ });
      continue;
    }
    // header
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({ type: "h", level: h[1].length, text: h[2], key: key++ });
      i++;
      continue;
    }
    // quote
    if (/^&gt;|^>/.test(line)) {
      const q = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        q.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: q.join("\n"), key: key++ });
      continue;
    }
    // list
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (
        i < lines.length &&
        (/^\s*[-*+]\s+/.test(lines[i]) || /^\s*\d+[.)]\s+/.test(lines[i]))
      ) {
        items.push(lines[i].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered, items, key: key++ });
      continue;
    }
    // blank
    if (!line.trim()) {
      i++;
      continue;
    }
    // paragraph
    const p = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^>/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      p.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: p.join("\n"), key: key++ });
  }
  return blocks;
}

function CodeBlock({ lang, code }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    setCopied(true);
    toast("Kinopya ang code");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <pre>
      <div className="jd-code__head">
        <span>{lang || "code"}</span>
        <button className="jd-code__copy" onClick={copy} type="button">
          {copied ? <Check /> : <Copy />}
          {copied ? "Kinopya!" : "Kopyahin"}
        </button>
      </div>
      <code>{escapeHtml(code)}</code>
    </pre>
  );
}

export function MarkdownLite({ text }) {
  const blocks = renderMarkdownLite(text);
  return (
    <div className="jd-md">
      {blocks.map((b) => {
        if (b.type === "code") return <CodeBlock key={b.key} lang={b.lang} code={b.code} />;
        if (b.type === "h") {
          const Tag = `h${b.level}`;
          return <Tag key={b.key} dangerouslySetInnerHTML={{ __html: inlineFmt(b.text) }} />;
        }
        if (b.type === "quote")
          return <blockquote key={b.key} dangerouslySetInnerHTML={{ __html: inlineFmt(b.text) }} />;
        if (b.type === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return (
            <Tag key={b.key}>
              {b.items.map((it, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: inlineFmt(it) }} />
              ))}
            </Tag>
          );
        }
        return <p key={b.key} dangerouslySetInnerHTML={{ __html: inlineFmt(b.text) }} />;
      })}
    </div>
  );
}

/* ---------- marker cards ---------- */

function mapEmbedUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  // Google Maps share links → embeddable form
  if (/google\.[a-z.]+\/maps/i.test(u) && !/[?&]output=embed/.test(u)) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(u)}&output=embed`;
  }
  return u;
}

function MapCard({ marker }) {
  const { url, label } = marker.payload || {};
  const embed = mapEmbedUrl(url);
  return (
    <div className="jd-marker jd-map">
      {embed ? (
        <iframe title={label || "Live map"} src={embed} loading="lazy" />
      ) : null}
      <div className="jd-map__foot">
        <span>{label || "Live map"}</span>
        {url ? (
          <a className="jd-map__open" href={url} target="_blank" rel="noopener noreferrer">
            Buksan <ExternalLink />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function AudioBubble({ marker }) {
  const text = String(marker.payload?.text || "");
  const [playing, setPlaying] = useState(false);
  const { toast } = useToast();
  const utterRef = useRef(null);

  const toggle = useCallback(() => {
    try {
      if (playing) {
        speechSynthesis.cancel();
        setPlaying(false);
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      // Tagalog kapag may ñ/mga salitang Tagalog, English kung hindi
      const isTl = /[ñÑ]|(\b(mga|ang|ng|sa|ako|ikaw|siya|kami|tayo|naman|lang|rin|din|po|opo)\b)/i.test(text);
      utter.lang = isTl ? "fil-PH" : "en-US";
      utter.onend = () => setPlaying(false);
      utter.onerror = () => setPlaying(false);
      utterRef.current = utter;
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
      setPlaying(true);
    } catch {
      toast("Hindi suportado ang speech sa device na ito");
    }
  }, [playing, text, toast]);

  return (
    <div className="jd-marker jd-audio">
      <button className="jd-audio__play" onClick={toggle} type="button" aria-label={playing ? "Itigil" : "Pakinggan"}>
        {playing ? <Pause /> : <Play />}
      </button>
      <span className="jd-audio__text">{text}</span>
      {playing && (
        <span className="jd-audio__bars" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
      )}
    </div>
  );
}

function LyricsCard({ marker, bodyText }) {
  const { artist, title } = marker.payload || {};
  const { toast } = useToast();
  const [speaking, setSpeaking] = useState(false);

  const copy = async () => {
    const full = `"${title}" — ${artist}\n\n${bodyText || ""}`;
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = full;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    toast("Kinopya ang lyrics");
  };

  const readAloud = () => {
    try {
      if (speaking) {
        speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      const utter = new SpeechSynthesisUtterance(String(bodyText || `${title} by ${artist}`));
      utter.lang = /[ñÑ]/.test(bodyText || "") ? "fil-PH" : "en-US";
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
      setSpeaking(true);
    } catch {
      toast("Hindi suportado ang speech sa device na ito");
    }
  };

  return (
    <div className="jd-marker jd-lyrics">
      <div className="jd-lyrics__head">
        <Music />
        <div>
          <div className="jd-lyrics__title">{title || "Lyrics"}</div>
          <div className="jd-lyrics__artist">{artist || ""}</div>
        </div>
      </div>
      {bodyText ? <div className="jd-lyrics__body">{bodyText}</div> : null}
      <div className="jd-lyrics__foot">
        <button className="jd-lyrics__btn" onClick={copy} type="button">
          <Copy /> Kopyahin
        </button>
        <button className="jd-lyrics__btn" onClick={readAloud} type="button">
          <Volume2 /> {speaking ? "Itigil" : "Basahin"}
        </button>
      </div>
    </div>
  );
}

function CrewCard({ marker }) {
  const items = marker.payload?.items || [];
  return (
    <div className="jd-marker jd-crew">
      <div className="jd-crew__title">
        <Users /> Crew plan ({items.length})
      </div>
      {items.map((it, i) => (
        <div className="jd-crew__item" key={i}>
          <span className="jd-crew__role">{it.role || `Task ${i + 1}`}</span>
          <span className="jd-crew__task">{it.task}</span>
        </div>
      ))}
    </div>
  );
}

export function MarkerCard({ marker, bodyText }) {
  if (!marker) return null;
  if (marker.type === "audio") return <AudioBubble marker={marker} />;
  if (marker.type === "lyrics") return <LyricsCard marker={marker} bodyText={bodyText} />;
  if (marker.type === "map") return <MapCard marker={marker} />;
  if (marker.type === "crew") return <CrewCard marker={marker} />;
  return null;
}

/* ---------- Message ---------- */

export default function Message({ message, isStreaming, onReply, onDictate }) {
  const { toast } = useToast();
  const { openTool } = useTools();
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState(false);
  const isUser = message.role === "user";
  const markers = message.markers || [];
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message.content || "";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      ta.remove();
    }
    setCopied(true);
    toast("Kinopya ang mensahe");
    setTimeout(() => setCopied(false), 1500);
  };

  const time = message.at
    ? new Date(message.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`jd-msg jd-msg--${isUser ? "user" : "assistant"}`}>
      <div className="jd-bubble">
        {isUser ? (
          <>
            {attachments.length > 0 ? (
              <div className="jd-attchips">
                {attachments.map((a, i) => (
                  <span className="jd-attchip" key={i} title={a.name}>
                    <FileText />
                    <span className="jd-attchip__name">{a.name}</span>
                    {isTextEditable(a) ? (
                      <button
                        type="button"
                        className="jd-attchip__edit"
                        onClick={() => openTool("editor", { open: chatFileName(a.name) })}
                      >
                        <Pencil /> Edit
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="jd-md">
              <p dangerouslySetInnerHTML={{ __html: inlineFmt(message.content || "") }} />
            </div>
          </>
        ) : (
          <>
            {message.content ? (
              <MarkdownLite text={message.content} />
            ) : isStreaming ? (
              <span className="jd-thinking">
                <span className="jd-status-dot jd-status-dot--sm" />
                Nag-iisip…
              </span>
            ) : null}
            {markers.map((mk, i) => (
              <MarkerCard key={`${mk.type}-${i}`} marker={mk} bodyText={message.content} />
            ))}
          </>
        )}
      </div>
      <div className="jd-msg__meta">
        {message.stopped ? <span>Itinigil</span> : null}
        {time ? <span>{time}</span> : null}
        {!isUser && (
          <div className="jd-reactions" role="toolbar" aria-label="Message actions">
            <button
              className="jd-react-btn"
              type="button"
              title="Reply"
              onClick={() => onReply?.(message)}
            >
              <Reply />
            </button>
            <button
              className={`jd-react-btn ${copied ? "jd-react-btn--active" : ""}`}
              type="button"
              title="Copy"
              onClick={copyText}
            >
              {copied ? <Check /> : <Copy />}
            </button>
            <button
              className={`jd-react-btn ${selected ? "jd-react-btn--active" : ""}`}
              type="button"
              title="Select"
              onClick={() => {
                setSelected((v) => !v);
                toast(selected ? "Na-deselect" : "Na-select ang mensahe");
              }}
            >
              <Scissors />
            </button>
            <button
              className="jd-react-btn"
              type="button"
              title="Dictate (basahin)"
              onClick={() => onDictate?.(message)}
            >
              <Mic />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
