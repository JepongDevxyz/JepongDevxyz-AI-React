/* GeminiShell — Gemini app style (pixel direction: Google Gemini app)
   Pristine white, gradient sparkle logo accent, "Hello, Jepong" with
   gradient name, suggestion chips row, bottom pill composer
   "Ask Gemini", minimal chrome, airy whitespace. Light-first.
   Nav = expandable history panel (tulad ng Gemini app drawer).
   Brand: GeminiMark (carbon copy sparkle) sa rail, header, greeting, send.
   Slots: { nav, header, main, composer } */
import { useState } from "react";
import { MessageSquare, Compass, Clock3, Settings, X } from "lucide-react";
import GeminiMark from "../brand/GeminiMark.jsx";

const RAIL_ITEMS = [
  { key: "chat", icon: MessageSquare, label: "Chat" },
  { key: "explore", icon: Compass, label: "Explore" },
  { key: "history", icon: Clock3, label: "History" },
];

export default function GeminiShell({ nav, header, main, composer }) {
  const [active, setActive] = useState("chat");
  const [historyOpen, setHistoryOpen] = useState(false);

  const onRail = (key) => {
    setActive(key);
    if (key === "history") setHistoryOpen(true);
  };

  return (
    <div className="shell shell-gemini">
      {/* Slim minimal rail */}
      <nav className="gm-rail" aria-label="Primary">
        <span className="gm-mark" style={{ marginBottom: 12 }}>
          <GeminiMark size={30} />
        </span>
        {RAIL_ITEMS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            className={`gm-rail__btn${active === key ? " is-active" : ""}`}
            aria-label={label}
            title={label}
            onClick={() => onRail(key)}
          >
            <Icon size={22} strokeWidth={1.8} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" className="gm-rail__btn" aria-label="Settings" title="Settings">
          <Settings size={22} strokeWidth={1.8} />
        </button>
      </nav>

      {/* Expandable history panel (Gemini-style drawer) */}
      {historyOpen && (
        <>
          <div
            className="mn-drawer-backdrop"
            onClick={() => setHistoryOpen(false)}
            aria-hidden="true"
          />
          <aside className="mn-drawer" aria-label="History">
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 8px 0" }}>
              <button
                type="button"
                className="jd-icon-btn"
                aria-label="Close history"
                onClick={() => setHistoryOpen(false)}
              >
                <X size={22} strokeWidth={1.8} />
              </button>
            </div>
            {nav}
          </aside>
        </>
      )}

      <div className="gm-body">
        <header className="gm-top">
          <GeminiMark size={24} />
          <span className="gm-top__title">Gemini</span>
          <div className="gm-top__spacer" />
          {header}
        </header>

        <main className="gm-main">
          <h1 className="gm-greeting">
            <GeminiMark size={40} className="gm-greeting__mark" />
            <span>
              Hello, <span className="gm-name">Jepong</span>
            </span>
          </h1>
          {main}
        </main>

        <div className="gm-composer">{composer}</div>
      </div>
    </div>
  );
}
