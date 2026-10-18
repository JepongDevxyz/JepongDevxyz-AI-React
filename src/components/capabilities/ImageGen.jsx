/* ImageGen — image generation panel.
   Prompt → POST /api/chat na may imagine mode (streamChat, mode:'imagine';
   sinasabay din ang ChatContext chatMode='imagine' para mag-reflect sa composer).
   Ang generated image ay kinukuha mula sa reply: markdown image, artifact/image
   events (kung i-emit ng backend bilang URL), o direktang image URL.
   History: localStorage jai_imagegen_v1 (20 pinakabago). */
import { useState } from "react";
import { ImagePlus, Loader2, AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import Shimmer from "../ui/Shimmer.jsx";
import { streamChat } from "../../api/chat.js";
import { useChat } from "../../state/ChatContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";

const LS_KEY = "jai_imagegen_v1";

function readHistory() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function extractImages(text) {
  const out = [];
  const seen = new Set();
  const src = String(text || "");
  // markdown images ![alt](url)
  const reMd = /!\[[^\]]*\]\((https?:\/\/[^\s)]+|data:image\/[^;]+;base64,[^\s)]+)\)/g;
  let m;
  while ((m = reMd.exec(src))) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  // direktang image URLs
  const reUrl = /(https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif)(\?[^\s"'<>]*)?)/gi;
  while ((m = reUrl.exec(src))) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

export default function ImageGen({ onClose }) {
  const { toast } = useToast();
  const { setChatMode } = useChat();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState([]);
  const [note, setNote] = useState("");
  const [connError, setConnError] = useState(false);
  const [history, setHistory] = useState(readHistory);

  const saveHistory = (entry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 20);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const generate = async () => {
    const p = prompt.trim();
    if (!p || generating) return;
    setGenerating(true);
    setConnError(false);
    setImages([]);
    setNote("");
    setChatMode("imagine");

    let acc = "";
    let err = null;
    try {
      await streamChat({
        messages: [
          {
            role: "user",
            content: `Generate an image from this description. Kung kaya ng backend, ibalik ang image bilang markdown image ![result](IMAGE_URL). Description: ${p}`,
          },
        ],
        mode: "imagine",
        onToken: (t) => {
          acc += t;
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
      toast(String((err && err.message) || "Hindi makabuo ng image"));
    } else {
      const imgs = extractImages(acc);
      if (imgs.length) {
        setImages(imgs);
        saveHistory({ prompt: p, images: imgs.slice(0, 4), at: Date.now() });
      } else if (acc.trim()) {
        setNote(
          "Walang image URL na ibinalik ang backend — ito ang text reply:"
        );
        setImages([]);
        saveHistory({ prompt: p, images: [], note: acc.slice(0, 300), at: Date.now() });
      } else {
        setNote("Walang ibinalik ang backend. Subukan ulit.");
      }
    }
    setGenerating(false);
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    setHistory([]);
  };

  return (
    <Modal open onClose={onClose} title="Image Gen" wide>
      <div className="jd-cap-stack">
        <div className="jd-cap-addrow">
          <input
            className="jd-cap-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generate();
            }}
            placeholder="Ilarawan ang image na gusto mo…"
            maxLength={500}
            aria-label="Image prompt"
            disabled={generating}
          />
          <button
            type="button"
            className="jd-cap-btn"
            onClick={generate}
            disabled={generating || !prompt.trim()}
          >
            {generating ? <Loader2 size={16} className="jd-spin" /> : <ImagePlus size={16} />}
            {generating ? "Gumagawa…" : "Generate"}
          </button>
        </div>

        {connError ? (
          <div className="jd-cap-warning">
            <AlertTriangle size={15} />
            <span>
              Kailangan ng koneksyon sa backend — hindi maabot ang <code>/api/chat</code>.
            </span>
            <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={generate}>
              <RotateCcw size={15} /> Subukan ulit
            </button>
          </div>
        ) : null}

        {generating ? <Shimmer lines={2} variant="chat" /> : null}

        {images.length > 0 ? (
          <div className="jd-imgs">
            {images.map((u, i) => (
              <a key={`${u}-${i}`} href={u} target="_blank" rel="noopener noreferrer" title="Buksan ang full image">
                <img src={u} alt={`Generated: ${prompt.slice(0, 60)}`} loading="lazy" />
              </a>
            ))}
          </div>
        ) : null}
        {note ? <div className="jd-cap-note">{note}</div> : null}

        {history.length > 0 ? (
          <>
            <div className="jd-cap-subhead">
              History ({history.length})
              <button
                type="button"
                className="jd-cap-iconbtn jd-cap-iconbtn--danger"
                onClick={clearHistory}
                aria-label="Linisin ang history"
                title="Linisin ang history"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="jd-cap-list jd-cap-list--compact">
              {history.map((h, i) => (
                <button
                  key={`${h.at}-${i}`}
                  type="button"
                  className="jd-hist-row"
                  onClick={() => {
                    setPrompt(h.prompt);
                    setImages(h.images || []);
                  }}
                  title="Gamitin ulit ang prompt na ito"
                >
                  {h.images && h.images[0] ? (
                    <img src={h.images[0]} alt="" className="jd-hist-row__thumb" loading="lazy" />
                  ) : (
                    <span className="jd-hist-row__thumb jd-hist-row__thumb--empty">
                      <ImagePlus size={16} />
                    </span>
                  )}
                  <span className="jd-hist-row__text">{h.prompt}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
