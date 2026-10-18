/* Composer.jsx — textarea (auto-grow), (+) 232px popup sheet, mic/dictate,
   send/stop morph, effort badge, suggestion chips, file preview chips,
   large-paste sheet, commands modal, mode tabs, incognito toggle, model picker.
   Lahat ng buttons: lucide-react icons + real handlers. */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Mic, MicOff, Send, Square, X, Paperclip, Image as ImageIcon,
  Terminal, EyeOff, Eye, FileText, Sparkles, Code2, Compass, MessageSquare,
  Wand2, Hammer, Wrench,
} from "lucide-react";
import { useChat } from "../../state/ChatContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import { useTools } from "../../state/ToolsContext.jsx";
import { useReplySeed } from "./ChatView.jsx";
import EffortBadge from "./EffortBadge.jsx";
import ThoughtsSheet from "./ThoughtsSheet.jsx";
import { ModelPickerButton } from "./ModelPicker.jsx";
import Modal from "../ui/Modal.jsx";
import Sheet from "../ui/Sheet.jsx";

/* ---------- composer draft bridge (mula sa labas, hal. suggestion taps) ---------- */
let draftSeed = "";
const draftListeners = new Set();
export function pushComposerDraft(v) {
  draftSeed = v || "";
  draftListeners.forEach((fn) => fn(draftSeed));
}
/* Pinakabagong composer text — para sa Export tool ("Composer text" source). */
let latestComposerText = "";
export function peekComposerText() {
  return latestComposerText;
}
function useComposerDraft() {
  const [seed, setSeed] = useState(draftSeed);
  useEffect(() => {
    const fn = (v) => setSeed(v);
    draftListeners.add(fn);
    return () => {
      draftListeners.delete(fn);
    };
  }, []);
  return [seed, pushComposerDraft];
}
/* -------------------------------------------------------------------------------- */

const SUGGESTIONS = [
  { icon: Sparkles, text: "Ano ang kaya mong gawin?" },
  { icon: ImageIcon, text: "Gumawa ka ng image ng sunset sa beach" },
  { icon: Code2, text: "Gumawa ka ng simpleng todo app sa HTML" },
  { icon: Compass, text: "Ipakita mo ang mapa ng Makati" },
];

const COMMANDS = [
  { cmd: "/imagine", desc: "Gumawa ng image mula sa description", action: "mode:imagine" },
  { cmd: "/build", desc: "Code/build mode", action: "mode:build" },
  { cmd: "/ask", desc: "Bumalik sa ask mode", action: "mode:ask" },
  { cmd: "/lyrics", desc: "Humingi ng song lyrics", action: "insert:/lyrics " },
  { cmd: "/sabi", desc: "Voice-note reply (sabihin mo…)", action: "insert:Sabihin mo: " },
  { cmd: "/clear", desc: "Linisin ang kasalukuyang chat", action: "clear" },
  { cmd: "/new", desc: "Bagong chat", action: "new" },
  { cmd: "/model", desc: "Buksan ang model picker", action: "model" },
  { cmd: "/effort", desc: "Baguhin ang effort level", action: "effort" },
  { cmd: "/help", desc: "Ipakita ang listahan ng commands", action: "help" },
];

const LARGE_PASTE_LIMIT = 2000;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result || "");
      const base64 = url.includes(",") ? url.split(",")[1] : url;
      resolve({ base64, dataUrl: url });
    };
    r.onerror = () => reject(new Error("Hindi mabasa ang file"));
    r.readAsDataURL(file);
  });
}

export default function Composer({ placeholder, sendIcon, pill = false }) {
  const {
    sendMessage,
    stopStream,
    isStreaming,
    chatMode,
    setChatMode,
    incognito,
    setIncognito,
    newSession,
    clearSession,
    messages,
  } = useChat();
  const { toast } = useToast();
  const { openMenu } = useTools();
  const [replySeed] = useReplySeed();
  const [draftSeed, pushDraft] = useComposerDraft();

  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [largePaste, setLargePaste] = useState(null); // {text}
  const [listening, setListening] = useState(false);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const imageRef = useRef(null);
  const recogRef = useRef(null);
  const plusWrapRef = useRef(null);

  const isEmpty = messages.length === 0;

  /* auto-grow */
  const autogrow = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => {
    autogrow();
  }, [value, autogrow]);

  /* i-track ang pinakabagong composer text (Export tool) */
  useEffect(() => {
    latestComposerText = value;
  }, [value]);

  /* reply seed → ilagay sa composer */
  useEffect(() => {
    if (replySeed) {
      setValue((prev) => (prev ? prev : "") + replySeed);
      pushDraft("");
      taRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replySeed]);

  /* draft seed (suggestion taps) */
  useEffect(() => {
    if (draftSeed) {
      setValue(draftSeed);
      pushComposerDraft("");
      taRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSeed]);

  /* isara ang (+) popup kapag nag-click sa labas */
  useEffect(() => {
    if (!plusOpen) return;
    const onDoc = (e) => {
      if (plusWrapRef.current && !plusWrapRef.current.contains(e.target)) {
        setPlusOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setPlusOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [plusOpen]);

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isStreaming;

  const doSend = useCallback(
    (textOverride) => {
      const text = (textOverride ?? value).trim();
      if ((!text && attachments.length === 0) || isStreaming) return;
      const atts = attachments.map((a) => ({
        name: a.name,
        mimeType: a.mimeType,
        data: a.base64,
      }));
      sendMessage(text || "(attachment)", { attachments: atts });
      setValue("");
      setAttachments((prev) => {
        prev.forEach((a) => {
          if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
        });
        return [];
      });
      requestAnimationFrame(autogrow);
    },
    [value, attachments, isStreaming, sendMessage, autogrow]
  );

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const onChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (v.trim() === "/") setCommandsOpen(true);
  };

  const onPaste = (e) => {
    const text = e.clipboardData?.getData("text") || "";
    if (text.length > LARGE_PASTE_LIMIT) {
      e.preventDefault();
      setLargePaste({ text });
    }
  };

  /* ---------- attachments ---------- */
  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        toast(`Masyadong malaki: ${file.name} (max 8MB)`);
        continue;
      }
      try {
        const { base64, dataUrl } = await fileToBase64(file);
        const isImg = (file.type || "").startsWith("image/");
        setAttachments((prev) => [
          ...prev.slice(0, 4),
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            base64,
            previewUrl: isImg ? dataUrl : null,
          },
        ]);
      } catch {
        toast(`Hindi mabasa: ${file.name}`);
      }
    }
    setPlusOpen(false);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  /* Mula sa labas: Upload tool (ToolsMenu) → idagdag sa composer attachments */
  const addFilesRef = useRef(null);
  useEffect(() => {
    addFilesRef.current = addFiles;
  });
  useEffect(() => {
    const onAttach = (e) => {
      const files = e.detail?.files;
      if (files && files.length && addFilesRef.current) addFilesRef.current(files);
    };
    window.addEventListener("jd:attach-files", onAttach);
    return () => window.removeEventListener("jd:attach-files", onAttach);
  }, []);

  /* ---------- dictate (speech recognition + fallback) ---------- */
  const toggleDictate = useCallback(() => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast("Walang speech recognition sa browser na ito");
      return;
    }
    if (listening) {
      try {
        recogRef.current?.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }
    try {
      const recog = new SR();
      recog.lang = "fil-PH";
      recog.interimResults = false;
      recog.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map((r) => r[0]?.transcript || "")
          .join(" ")
          .trim();
        if (transcript) {
          setValue((prev) => (prev ? prev + " " : "") + transcript);
          taRef.current?.focus();
        }
      };
      recog.onerror = () => {
        setListening(false);
        toast("Hindi narinig — subukan ulit");
      };
      recog.onend = () => setListening(false);
      recogRef.current = recog;
      recog.start();
      setListening(true);
      toast("Nakikinig… magsalita ka na");
    } catch {
      toast("Hindi masimulan ang dictate");
    }
  }, [listening, toast]);

  /* ---------- commands ---------- */
  const runCommand = (action) => {
    setCommandsOpen(false);
    if (action.startsWith("mode:")) {
      const m = action.slice(5);
      setChatMode(m);
      toast(`Mode: ${m === "ask" ? "Ask" : m === "imagine" ? "Imagine" : "Build"}`);
    } else if (action.startsWith("insert:")) {
      setValue((prev) => prev + action.slice(7));
      taRef.current?.focus();
    } else if (action === "clear") {
      clearSession();
      toast("Nalinis ang chat");
    } else if (action === "new") {
      newSession();
      toast("Bagong chat");
    } else if (action === "help") {
      doSend("Ano ang mga command na pwede kong gamitin?");
    }
    // "model" at "effort" — buksan ang tunay na buttons sa row2
    if (action === "model")
      document.querySelector("#jd-open-model-picker .jd-model-btn")?.click();
    if (action === "effort")
      document.querySelector("#jd-open-effort .jd-effort")?.click();
  };

  const modeTabs = [
    { id: "ask", label: "Ask", icon: MessageSquare },
    { id: "imagine", label: "Imagine", icon: Wand2 },
    { id: "build", label: "Build", icon: Hammer },
  ];

  return (
    <div className="jd-composer">
      {isEmpty ? (
        <div className="jd-suggest">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              className="jd-chip"
              type="button"
              onClick={() => pushComposerDraft(s.text)}
            >
              <s.icon />
              {s.text}
            </button>
          ))}
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className="jd-attach-row">
          {attachments.map((a) => (
            <span className="jd-attach-chip" key={a.id}>
              {a.previewUrl ? (
                <img src={a.previewUrl} alt={a.name} />
              ) : (
                <FileText />
              )}
              <span title={a.name}>{a.name}</span>
              <button type="button" onClick={() => removeAttachment(a.id)} aria-label="Alisin">
                <X />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className={`jd-composer__bar ${pill ? "jd-composer__bar--pill" : ""}`}>
        <div ref={plusWrapRef} style={{ position: "relative" }}>
          <button
            className="jd-icon-btn"
            type="button"
            title="Mag-attach"
            aria-label="Mag-attach"
            onClick={() => setPlusOpen((v) => !v)}
          >
            <Plus />
          </button>
          {plusOpen ? (
            <div className="jd-plus-pop" role="menu">
              <button className="jd-plus-row" type="button" onClick={() => fileRef.current?.click()}>
                <Paperclip />
                <span>Mag-attach ng file<small>Docs, code, text — max 8MB</small></span>
              </button>
              <button className="jd-plus-row" type="button" onClick={() => imageRef.current?.click()}>
                <ImageIcon />
                <span>Mag-attach ng image<small>Vision analysis kung kaya ng model</small></span>
              </button>
              <button className="jd-plus-row" type="button" onClick={() => { setPlusOpen(false); toggleDictate(); }}>
                <Mic />
                <span>Dictate<small>Speech-to-text sa composer</small></span>
              </button>
              <button className="jd-plus-row" type="button" onClick={() => { setPlusOpen(false); setCommandsOpen(true); }}>
                <Terminal />
                <span>Commands<small>Slash commands list</small></span>
              </button>
              <button className="jd-plus-row" type="button" onClick={() => { setPlusOpen(false); openMenu(); }}>
                <Wrench />
                <span>Tools<small>Todos, JS runner, editor, research…</small></span>
              </button>
            </div>
          ) : null}
        </div>

        <textarea
          ref={taRef}
          className="jd-composer__input"
          rows={1}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={placeholder || "Magtanong kay JepongDevxyz AI…"}
          aria-label="Mensahe"
        />

        <button
          className="jd-icon-btn"
          type="button"
          title={listening ? "Itigil ang dictate" : "Dictate"}
          aria-label="Dictate"
          onClick={toggleDictate}
          style={listening ? { color: "var(--accent)" } : undefined}
        >
          {listening ? <MicOff /> : <Mic />}
        </button>

        {isStreaming ? (
          <button
            className="jd-icon-btn jd-icon-btn--send"
            type="button"
            title="Itigil"
            aria-label="Itigil ang pag-stream"
            onClick={stopStream}
          >
            <Square />
          </button>
        ) : (
          <button
            className="jd-icon-btn jd-icon-btn--send"
            type="button"
            title="I-send"
            aria-label="I-send"
            disabled={!canSend}
            onClick={() => doSend()}
          >
            {sendIcon || <Send />}
          </button>
        )}
      </div>

      <div className="jd-composer__row2">
        <div className="jd-mode-tabs" role="tablist" aria-label="Mode">
          {modeTabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={chatMode === t.id}
              className={`jd-mode-tab ${chatMode === t.id ? "jd-mode-tab--active" : ""}`}
              type="button"
              onClick={() => setChatMode(t.id)}
            >
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>

        <span id="jd-open-effort" style={{ display: "contents" }}>
          <EffortBadge />
        </span>

        <span id="jd-open-model-picker" style={{ display: "contents" }}>
          <ModelPickerButton />
        </span>

        <button
          className={`jd-mini-toggle ${incognito ? "jd-mini-toggle--on" : ""}`}
          type="button"
          onClick={() => {
            setIncognito(!incognito);
            toast(incognito ? "Incognito OFF" : "Incognito ON — hindi mase-save ang chat");
          }}
          title="Incognito — hindi naka-save ang chat"
        >
          {incognito ? <EyeOff /> : <Eye />}
          {incognito ? "Incognito" : "Naka-save"}
        </button>

        <ThoughtsSheet />
      </div>

      {/* hidden file inputs */}
      <input
        ref={fileRef}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* commands modal */}
      <Modal open={commandsOpen} onClose={() => setCommandsOpen(false)} title="Commands">
        {COMMANDS.map((c) => (
          <button key={c.cmd} className="jd-cmd-row" type="button" onClick={() => runCommand(c.action)}>
            <code>{c.cmd}</code>
            <small>{c.desc}</small>
          </button>
        ))}
      </Modal>

      {/* large-paste sheet */}
      <Sheet
        open={!!largePaste}
        onClose={() => setLargePaste(null)}
        title={`Malaking paste (${largePaste ? largePaste.text.length.toLocaleString() : 0} chars)`}
      >
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
          Mahaba ang na-paste mo. I-send bilang text, o i-save bilang .txt attachment?
        </div>
        <div
          style={{
            maxHeight: 160,
            overflowY: "auto",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 10,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            marginBottom: 12,
          }}
        >
          {largePaste ? largePaste.text.slice(0, 600) : ""}
          {largePaste && largePaste.text.length > 600 ? "…" : ""}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="jd-lyrics__btn"
            type="button"
            onClick={() => {
              const t = largePaste.text;
              setLargePaste(null);
              doSend(t);
            }}
          >
            I-send bilang text
          </button>
          <button
            className="jd-lyrics__btn"
            type="button"
            onClick={() => {
              const t = largePaste.text;
              setLargePaste(null);
              const base64 = btoa(unescape(encodeURIComponent(t)));
              setAttachments((prev) => [
                ...prev,
                {
                  id: `paste-${Date.now()}`,
                  name: "pasted-text.txt",
                  mimeType: "text/plain",
                  base64,
                  previewUrl: null,
                },
              ]);
              toast("Nai-save bilang pasted-text.txt");
            }}
          >
            I-save bilang .txt
          </button>
        </div>
      </Sheet>
    </div>
  );
}
