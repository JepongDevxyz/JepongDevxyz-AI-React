/* AuroraShell — "Floating Glass"
   Sidebar = floating rounded-3xl panel (16px margins, blur 24px,
   translucent). Floating blur-pill header. Floating pill composer.
   Aurora gradient blobs fixed in background.
   Slots: { nav, header, main, composer } */
import { useState } from "react";
import { Hamburger, DrawerBackdrop } from "./DrawerNav.jsx";

export default function AuroraShell({ nav, header, main, composer }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className={`shell shell-aurora${drawerOpen ? " nav-open" : ""}`}>
      {drawerOpen && <DrawerBackdrop onClose={() => setDrawerOpen(false)} />}
      <div className="au-blobs" aria-hidden="true">
        <i className="au-blob au-blob--violet" />
      </div>

      <aside className="au-sidebar" aria-label="Conversations">
        {nav}
      </aside>

      <div className="au-body">
        <header className="au-pill">
          <Hamburger onOpen={() => setDrawerOpen(true)} />
          {header}
        </header>
        <main className="au-main">{main}</main>
        <div className="au-composer">{composer}</div>
      </div>
    </div>
  );
}
