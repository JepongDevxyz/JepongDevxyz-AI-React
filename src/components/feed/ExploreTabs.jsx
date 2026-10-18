/* ExploreTabs — Phase 4 (checklist E31).
   Explore tab bar: Feed | Ideas | Goals | Library — HINDI ibinalik ang
   standalone buttons. Bubukas via "jd:open-explore" event { tab }.
   Bottom tab bar na may Lucide outline icons (Muse-app parity). */
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Newspaper, Lightbulb, Target, FolderOpen } from "lucide-react";
import FeedView from "./FeedView.jsx";
import IdeasView from "./IdeasView.jsx";
import GoalsView from "../goals/GoalsView.jsx";
import LibraryView from "../settings/LibraryView.jsx";
import "./feed.css";

const TABS = [
  { id: "feed", label: "Feed", Icon: Newspaper },
  { id: "ideas", label: "Ideas", Icon: Lightbulb },
  { id: "goals", label: "Goals", Icon: Target },
  { id: "library", label: "Library", Icon: FolderOpen },
];

const TITLES = { feed: "Feed", ideas: "Ideas", goals: "Goals", library: "Library" };

export function openExplore(tab = "feed") {
  window.dispatchEvent(new CustomEvent("jd:open-explore", { detail: { tab } }));
}

export default function ExploreTabs({ initialTab = "feed", onClose }) {
  const [tab, setTab] = useState(
    TABS.some((t) => t.id === initialTab) ? initialTab : "feed"
  );

  const close = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Kapag muling binuksan na may ibang tab
  useEffect(() => {
    if (TABS.some((t) => t.id === initialTab)) setTab(initialTab);
  }, [initialTab]);

  // Isara sa Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="jd-explore" role="dialog" aria-modal="true" aria-label="Explore">
      <div className="jd-explore__head">
        <button
          type="button"
          className="jd-icon-btn"
          aria-label="Bumalik"
          onClick={close}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="jd-explore__title">{TITLES[tab]}</span>
      </div>

      <div className="jd-explore__content">
        {tab === "feed" ? <FeedView /> : null}
        {tab === "ideas" ? <IdeasView /> : null}
        {tab === "goals" ? <GoalsView /> : null}
        {tab === "library" ? <LibraryView /> : null}
      </div>

      <nav className="jd-explore__tabbar" aria-label="Explore tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`jd-explore__tab${tab === id ? " is-active" : ""}`}
            onClick={() => setTab(id)}
            aria-selected={tab === id}
            role="tab"
          >
            <Icon size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
