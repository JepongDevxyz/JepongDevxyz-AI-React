/* FeedView — Phase 4 (checklist E34).
   - Feed brief editor ("Feed instructions") — user-editable prompt
   - AI-generated posts: subok sa /api/chat kapag may backend; kung wala,
     local generation mula sa brief + goals (mock-tolerant, walang fake AI claim)
   - Post cards: emoji, kicker, headline, body, timestamp, Discuss button
   - Per-user cache sa localStorage; regenerate on demand */
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, MessageCircle, SlidersHorizontal, Newspaper } from "lucide-react";
import { useToast } from "../../state/ToastContext.jsx";
import Sheet from "../ui/Sheet.jsx";
import "./feed.css";

const LS_BRIEF = "jai_feed_brief_v1";
const LS_POSTS = "jai_feed_posts_v1";
const LS_GEN = "jai_feed_generated_at_v1";

const DEFAULT_BRIEF =
  "Make me a feed about my interests. Keep the tone clear and direct. Ensure it is quick to skim. Try to avoid clickbait.";

const KICKERS = ["Tech", "AI", "Dev Tools", "Productivity", "Mobile", "Web"];
const EMOJIS = ["🚀", "💡", "⚙️", "📱", "🧠", "🛠️"];

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
    return `f-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "ngayon lang";
  if (s < 3600) return `${Math.floor(s / 60)}m nakalipas`;
  if (s < 86400) return `${Math.floor(s / 3600)}h nakalipas`;
  return `${Math.floor(s / 86400)}d nakalipas`;
}

/* Local fallback generation — malinaw na local, hindi AI */
function localGenerate(brief, goals) {
  const topics = goals.length
    ? goals.slice(0, 3).map((g) => g.title)
    : ["mga bagong dev tools", "AI assistants", "mobile development"];
  return topics.map((topic, i) => ({
    id: uid(),
    emoji: EMOJIS[i % EMOJIS.length],
    kicker: KICKERS[i % KICKERS.length],
    headline: `Update sa: ${topic}`,
    body:
      `Batay sa feed brief mo ("${brief.slice(0, 80)}${brief.length > 80 ? "…" : ""}") ` +
      `at sa goal mong "${topic}". I-tap ang Discuss para pag-usapan ito sa chat. ` +
      `(Local preview — i-connect ang backend para sa AI-generated feed.)`,
    at: Date.now() - i * 3600 * 1000,
    local: true,
  }));
}

export default function FeedView() {
  const { toast } = useToast();
  const [brief, setBrief] = useState(() => readLS(LS_BRIEF, DEFAULT_BRIEF));
  const [posts, setPosts] = useState(() => readLS(LS_POSTS, []));
  const [briefOpen, setBriefOpen] = useState(false);
  const [draft, setDraft] = useState(brief);
  const [generating, setGenerating] = useState(false);

  useEffect(() => writeLS(LS_BRIEF, brief), [brief]);
  useEffect(() => writeLS(LS_POSTS, posts), [posts]);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      // Subukang gumamit ng /api/chat kapag may backend
      const goals = readLS("jai_goals_v1", []);
      let made = null;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content:
                  `Gumawa ka ng 3 maikling feed posts bilang JSON array. Bawat post: {emoji, kicker, headline, body}. ` +
                  `Feed brief: ${brief}. Mga goals ko: ${goals.map((g) => g.title).join("; ") || "wala pa"}. ` +
                  `Ibalik LANG ang JSON array, walang ibang teksto.`,
              },
            ],
            stream: false,
          }),
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const text = data?.text || data?.content || data?.message || "";
          const m = String(text).match(/\[[\s\S]*\]/);
          if (m) {
            const arr = JSON.parse(m[0]);
            if (Array.isArray(arr) && arr.length) {
              made = arr.slice(0, 6).map((p) => ({
                id: uid(),
                emoji: p.emoji || "📰",
                kicker: p.kicker || "Feed",
                headline: p.headline || "Update",
                body: p.body || "",
                at: Date.now(),
                local: false,
              }));
            }
          }
        }
      } catch {
        /* walang backend — local fallback */
      }
      if (!made) {
        made = localGenerate(brief, goals);
        toast("Local preview ang feed (walang backend)");
      } else {
        toast("Na-generate ang feed");
      }
      setPosts(made);
      writeLS(LS_GEN, Date.now());
    } finally {
      setGenerating(false);
    }
  }, [brief, toast]);

  const saveBrief = () => {
    const b = draft.trim() || DEFAULT_BRIEF;
    setBrief(b);
    setDraft(b);
    setBriefOpen(false);
    toast("Na-save ang feed instructions");
  };

  const discuss = (post) => {
    window.dispatchEvent(
      new CustomEvent("jd:open-chat-prompt", {
        detail: {
          prompt: `Pag-usapan natin ito mula sa feed ko:\n\n${post.headline}\n${post.body}`,
        },
      })
    );
  };

  return (
    <div>
      <button type="button" className="jd-feed-brief" onClick={() => { setDraft(brief); setBriefOpen(true); }}>
        <SlidersHorizontal size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
        Feed instructions: {brief}
      </button>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button
          type="button"
          className="jd-btn"
          onClick={generate}
          disabled={generating}
        >
          <RefreshCw size={14} className={generating ? "jd-spin" : ""} />
          {generating ? "Nagge-generate…" : "I-regenerate"}
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="jd-card" style={{ textAlign: "center", padding: "28px 16px" }}>
          <Newspaper size={30} style={{ color: "var(--faint)", marginBottom: 8 }} />
          <p style={{ margin: "0 0 12px" }}>Walang laman ang feed. I-generate ang unang batch!</p>
          <button type="button" className="jd-btn jd-btn--primary" onClick={generate} disabled={generating}>
            {generating ? "Nagge-generate…" : "I-generate ang feed"}
          </button>
        </div>
      ) : (
        posts.map((p) => (
          <article className="jd-post" key={p.id}>
            <div className="jd-post__top">
              <span className="jd-post__emoji" aria-hidden="true">{p.emoji}</span>
              <div className="jd-post__head">
                <div className="jd-post__kicker">{p.kicker}</div>
                <div className="jd-post__headline">{p.headline}</div>
              </div>
              <span className="jd-post__time">{timeAgo(p.at)}</span>
            </div>
            <p className="jd-post__body">{p.body}</p>
            <div className="jd-post__actions">
              <button type="button" className="jd-btn" onClick={() => discuss(p)}>
                <MessageCircle size={14} /> Discuss
              </button>
            </div>
          </article>
        ))
      )}

      <Sheet open={briefOpen} onClose={() => setBriefOpen(false)} title="Feed instructions">
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
          Ito ang prompt na nagpapatakbo sa feed generation — parang sa Muse app.
        </p>
        <div className="jd-field">
          <textarea
            className="jd-textarea"
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Feed instructions"
          />
        </div>
        <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={saveBrief}>
          I-save
        </button>
      </Sheet>
    </div>
  );
}
