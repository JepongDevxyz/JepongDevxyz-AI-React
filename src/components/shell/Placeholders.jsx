/* Placeholders — Phase 1 slot content. Papalitan ng tunay na
   chat/sidebar/settings sa Phase 2+. Theme-aware via CSS vars. */
import { Plus, Mic, ArrowUp, Search, Settings, Zap } from "lucide-react";
import Shimmer from "../ui/Shimmer.jsx";
import { ToolsButton } from "../capabilities/ToolsMenu.jsx";

const CONVS = [
  { t1: "Paano gumawa ng Android app?", t2: "Kahapon · 12 mensahe" },
  { t1: "VPS setup guide", t2: "Kahapon · 8 mensahe" },
  { t1: "Free API credits list", t2: "2 araw na nakalipas · 20 mensahe" },
  { t1: "Lutong Pinoy recipes", t2: "3 araw na nakalipas · 6 mensahe" },
];

export function NavPlaceholder() {
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 2 }}>
      <div className="ph-account">
        <div className="ph-avatar" aria-hidden="true">J</div>
        <div>
          <div className="ph-account__name">Jepong</div>
          <div className="ph-account__plan">Free plan · 100 credits</div>
        </div>
      </div>
      <button type="button" className="ph-newchat">
        <Plus size={18} strokeWidth={2} />
        Bagong chat
      </button>
      <div className="nav-label" style={{ padding: "8px 12px 4px" }}>
        Mga usapan
      </div>
      {CONVS.map((c, i) => (
        <div className={`ph-conv${i === 0 ? " is-active" : ""}`} key={c.t1}>
          <div className="ph-conv__t1">{c.t1}</div>
          <div className="ph-conv__t2">{c.t2}</div>
        </div>
      ))}
    </div>
  );
}

export function HeaderPlaceholder() {
  return (
    <div className="ph-header">
      <span className="ph-header__title">
        <span className="jd-status-dot" aria-hidden="true" />
        JepongDevxyz AI
      </span>
      <span className="ph-header__spacer" />
      <ToolsButton />
      <button type="button" className="jd-icon-btn" aria-label="Search">
        <Search size={19} strokeWidth={1.8} />
      </button>
      <button type="button" className="jd-icon-btn" aria-label="Credits">
        <Zap size={19} strokeWidth={1.8} />
      </button>
      <button type="button" className="jd-icon-btn" aria-label="Settings">
        <Settings size={19} strokeWidth={1.8} />
      </button>
    </div>
  );
}

export function MainPlaceholder() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
      <Shimmer lines={3} variant="chat" />
      <div style={{ padding: "0 12px" }}>
        <span className="jd-thinking">
          <span className="jd-status-dot" aria-hidden="true" />
          Nag-iisip…
        </span>
      </div>
    </div>
  );
}

export function ComposerPlaceholder({ placeholder = "Magtanong…", sendIcon }) {
  return (
    <div className="ph-composer">
      <button type="button" className="ph-roundbtn" aria-label="Add">
        <Plus size={20} strokeWidth={2} />
      </button>
      <input
        className="ph-composer__input"
        placeholder={placeholder}
        aria-label={placeholder}
        readOnly
      />
      <button type="button" className="ph-roundbtn" aria-label="Voice input">
        <Mic size={19} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        className={`ph-roundbtn ph-send${sendIcon ? " ph-send--mark" : ""}`}
        aria-label="Send"
      >
        {sendIcon || <ArrowUp size={19} strokeWidth={2.2} />}
      </button>
    </div>
  );
}
