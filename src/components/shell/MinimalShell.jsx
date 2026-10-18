/* MinimalShell — "Quiet Paper"
   NO persistent sidebar. Hamburger top-left opens an overlay drawer
   (blur backdrop, nav slot inside). Single centered column, max 720px.
   Slots: { nav, header, main, composer } */
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function MinimalShell({ nav, header, main, composer }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="shell shell-minimal">
      <header className="mn-topbar">
        <button
          type="button"
          className="jd-icon-btn"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={22} strokeWidth={1.8} />
        </button>
        <span className="mn-brand">JepongDevxyz AI</span>
        <div className="mn-topbar__spacer" />
      </header>

      <div className="mn-column">
        <div className="mn-header">{header}</div>
        <main className="mn-main">{main}</main>
        <div className="mn-composer">{composer}</div>
      </div>

      {drawerOpen && (
        <>
          <div
            className="mn-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="mn-drawer" aria-label="Menu">
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 8px 0" }}>
              <button
                type="button"
                className="jd-icon-btn"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={22} strokeWidth={1.8} />
              </button>
            </div>
            {nav}
          </aside>
        </>
      )}
    </div>
  );
}
