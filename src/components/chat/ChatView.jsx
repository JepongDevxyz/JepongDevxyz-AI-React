/* ChatView.jsx — main chat area: MessageList + streaming status +
   empty state (design-aware greeting + Lottie welcome).

   Reply bridge: ChatView → Composer sa pamamagitan ng module-level
   replySeed (pinapakinggan ng Composer via useReplySeed). */
import { useEffect, useMemo, useState } from "react";
import { useChat } from "../../state/ChatContext.jsx";
import { useDesign } from "../../state/DesignContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import MessageList from "./MessageList.jsx";
import LottieView, { LOTTIE_TOP, LOTTIE_BOTTOM } from "../ui/LottieView.jsx";
import "./chat.css";

/* ---------- reply seed bridge (module scope) ---------- */
let replySeed = "";
const replySeedListeners = new Set();
export function pushReplySeed(v) {
  replySeed = v || "";
  replySeedListeners.forEach((fn) => fn(replySeed));
}
export function useReplySeed() {
  const [seed, setSeed] = useState(replySeed);
  useEffect(() => {
    const fn = (v) => setSeed(v);
    replySeedListeners.add(fn);
    return () => {
      replySeedListeners.delete(fn);
    };
  }, []);
  return [seed, pushReplySeed];
}
/* ------------------------------------------------------ */

function greetingFor(design) {
  switch (design) {
    case "gemini":
      return { title: "Hello, Jepong", sub: "Ano ang maitutulong ko sa iyo ngayon?" };
    case "chatgpt":
      return { title: "What can I help with?", sub: "" };
    case "claude":
      return { title: "Good morning, Jepong", sub: "Handa akong tumulong sa iyo ngayon." };
    case "muse":
      return { title: "Kumusta, Jepong!", sub: "Nandito ako para tumulong — magtanong ka lang." };
    default:
      return { title: "Kumusta, Jepong!", sub: "Ako si JepongDevxyz AI — ano ang pag-uusapan natin?" };
  }
}

export default function ChatView() {
  const {
    messages,
    streamingMessageId,
    streamingText,
    activityStatus,
    isStreaming,
  } = useChat();
  const { design } = useDesign();
  const { toast } = useToast();

  const greeting = useMemo(() => greetingFor(design), [design]);
  const isEmpty = messages.length === 0;

  const dictateMessage = (message) => {
    try {
      const text = String(message.content || "").slice(0, 2000);
      if (!text) return;
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = /[ñÑ]/.test(text) ? "fil-PH" : "en-US";
      speechSynthesis.speak(utter);
      toast("Binabasa ang mensahe…");
    } catch {
      toast("Hindi suportado ang speech sa device na ito");
    }
  };

  const replyTo = (message) => {
    const quote = String(message.content || "").split("\n")[0].slice(0, 120);
    pushReplySeed(`> ${quote}\n\n`);
    toast("Reply mode — isulat ang sagot sa composer");
  };

  return (
    <div className="jd-chat">
      <div className="jd-chat__scroll">
        {isEmpty ? (
          <div className="jd-welcome">
            {/* left intact — lottie welcome animations */}
            <LottieView src={LOTTIE_TOP} className="jd-welcome__lottie" />
            <h1 className={`jd-welcome__title ${design === "claude" || design === "midnight-amber" ? "jd-welcome__title--serif" : ""}`}>
              {greeting.title}
            </h1>
            {greeting.sub ? <p className="jd-welcome__sub">{greeting.sub}</p> : null}
            <div style={{ marginTop: 8, width: "100%", maxWidth: 560, aspectRatio: "16/9" }}>
              <LottieView src={LOTTIE_BOTTOM} style={{ width: "100%", height: "100%" }} />
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            streamingMessageId={streamingMessageId}
            streamingText={streamingText}
            onReply={replyTo}
            onDictate={dictateMessage}
          />
        )}
      </div>

      {isStreaming && activityStatus ? (
        <div className="jd-chat__status" role="status" aria-live="polite">
          <span className="jd-status-dot" aria-hidden="true" />
          <span className="jd-thinking">{activityStatus.label}</span>
        </div>
      ) : null}
    </div>
  );
}
