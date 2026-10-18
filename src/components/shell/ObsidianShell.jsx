/* ObsidianShell — "Command Deck"
   72px icon rail (hover tooltips) + conversations flyout + floating
   command-bar header + floating composer. Slots: { nav, header, main, composer } */
import { useState } from "react";
import {
  MessageSquare,
  Compass,
  Target,
  Image,
  PanelLeft,
  Settings,
} from "lucide-react";
import { Hamburger, DrawerBackdrop } from "./DrawerNav.jsx";

const RAIL_ITEMS = [
  { key: "chat", icon: MessageSquare, tip: "Chat" },
  { key: "explore", icon: Compass, tip: "Explore" },
  { key: "goals", icon: Target, tip: "Goals" },
  { key: "imagine", icon: Image, tip: "Imagine" },
];

export default function ObsidianShell({ nav, header, main, composer }) {
  const [flyoutOpen, setFlyoutOpen] = useState(true);
  const [active, setActive] = useState("chat");
  // On mobile the flyout becomes a drawer (nav-open overrides display:none)
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={`shell shell-obsidian${drawerOpen ? " nav-open" : ""}`}>
      {drawerOpen && <DrawerBackdrop onClose={() => { setDrawerOpen(false); setFlyoutOpen(false); }} />}
      {/* 72px icon rail */}
      <nav className="ob-rail" aria-label="Primary">
        <div className="ob-rail__logo" aria-hidden="true">JD</div>
        {RAIL_ITEMS.map(({ key, icon: Icon, tip }) => (
          <button
            key={key}
            type="button"
            className={`ob-rail__btn jd-tip${active === key ? " is-active" : ""}`}
            data-tip={tip}
            aria-label={tip}
            onClick={() => setActive(key)}
          >
            <Icon size={22} strokeWidth={1.8} />
          </button>
        ))}
        <div className="ob-rail__spacer" />
        <button
          type="button"
          className="ob-rail__btn jd-tip"
          data-tip="Toggle conversations"
          aria-label="Toggle conversations panel"
          onClick={() => {
            const isMobile = window.matchMedia("(max-width: 900px)").matches;
            if (isMobile) {
              setFlyoutOpen(true);
              setDrawerOpen(true);
            } else {
              setFlyoutOpen((v) => !v);
            }
          }}
        >
          <PanelLeft size={22} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className="ob-rail__btn jd-tip"
          data-tip="Settings"
          aria-label="Settings"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("jd:open-settings"))
          }
        >
          <Settings size={22} strokeWidth={1.8} />
        </button>
      </nav>

      {/* Conversations flyout */}
      <aside className={`ob-flyout${flyoutOpen ? "" : " is-closed"}`} aria-label="Conversations">
        {nav}
      </aside>

      {/* Body */}
      <div className="ob-body">
        <header className="ob-commandbar">{header}</header>
        <main className="ob-main">{main}</main>
        <div className="ob-composer">{composer}</div>
      </div>
    </div>
  );
}
