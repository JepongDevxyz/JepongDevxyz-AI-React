/* MuseShell — Muse app style (pixel direction: Meta muse.ai)
   Clean messaging-style layout. SINGLE persistent chat as the central
   thread (hindi hiwa-hiwalay na threads). Avatar-led header.
   Proactive Suggestions Panel (cards with task ideas) in main.
   Simple, friendly, approachable. Subtle Meta-blue accents.
   Brand: MuseMark (cream avatar face) sa header at chat avatar.
   Slots: { nav, header, main, composer } */
import { useState } from "react";
import { MessageCircle, Compass, Bell, Lightbulb, CalendarCheck, Newspaper, Sparkles } from "lucide-react";
import MuseMark from "../brand/MuseMark.jsx";
import { Hamburger, DrawerBackdrop } from "./DrawerNav.jsx";

const STRIP_ITEMS = [
  { key: "chat", icon: MessageCircle, label: "Chat" },
  { key: "explore", icon: Compass, label: "Explore" },
  { key: "alerts", icon: Bell, label: "Updates" },
];

const SUGGESTIONS = [
  { icon: CalendarCheck, label: "Plan my day" },
  { icon: Newspaper, label: "Morning briefing" },
  { icon: Lightbulb, label: "Brainstorm ideas" },
  { icon: Sparkles, label: "Surprise me" },
];

export default function MuseShell({ nav, header, main, composer }) {
  const [active, setActive] = useState("chat");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={`shell shell-muse${drawerOpen ? " nav-open" : ""}`}>
      {drawerOpen && <DrawerBackdrop onClose={() => setDrawerOpen(false)} />}
      {/* Slim icon strip — icons only */}
      <nav className="mu-navstrip" aria-label="Primary">
        {STRIP_ITEMS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            className={`mu-navstrip__btn${active === key ? " is-active" : ""}`}
            aria-label={label}
            title={label}
            onClick={() => setActive(key)}
          >
            <Icon size={22} strokeWidth={1.8} />
          </button>
        ))}
      </nav>

      {/* Sidebar panel — full nav slot (conversations, search, settings) */}
      <aside className="mu-sidepanel" aria-label="Sidebar">
        {nav}
      </aside>

      {/* Single persistent chat — central thread */}
      <div className="mu-thread">
        <div className="mu-thread__inner">
          <header className="mu-header">
            <Hamburger onOpen={() => setDrawerOpen(true)} />
            <MuseMark size={42} />
            <div>
              <div className="mu-header__name">JepongDevxyz AI</div>
              <div className="mu-header__status">
                <span className="jd-status-dot jd-status-dot--sm" aria-hidden="true" />
                Active now
              </div>
            </div>
            <div className="mu-header__spacer" />
            {header}
          </header>

          <main className="mu-main">
            <div className="mu-msg">
              <MuseMark size={28} className="mu-msg__avatar" />
              <div className="mu-bubble mu-bubble--ai">
                Hi Jepong! Ako si JepongDevxyz AI. Ano ang maitutulong ko sa'yo ngayon?
              </div>
            </div>
            {main}

            {/* Proactive Suggestions Panel */}
            <section className="mu-suggest" aria-label="Suggestions">
              <div className="mu-suggest__title">
                <Lightbulb size={15} strokeWidth={2} />
                Suggestions for you
              </div>
              <div className="mu-suggest__cards">
                {SUGGESTIONS.map(({ icon: Icon, label }) => (
                  <button key={label} type="button" className="mu-suggest__card">
                    <Icon size={20} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </section>
          </main>

          <div className="mu-composer">
            <div className="mu-composer__bar">{composer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
