/* VioletShell — "Energy"
   Deep-violet sidebar. Header with violet gradient wash. Rounded-3xl
   cards. Pill buttons. Violet-tinted shadows.
   Slots: { nav, header, main, composer } */
import { useState } from "react";
import { Hamburger, DrawerBackdrop } from "./DrawerNav.jsx";

export default function VioletShell({ nav, header, main, composer }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className={`shell shell-violet${drawerOpen ? " nav-open" : ""}`}>
      {drawerOpen && <DrawerBackdrop onClose={() => setDrawerOpen(false)} />}
      <aside className="vi-sidebar" aria-label="Conversations">
        {nav}
      </aside>

      <div className="vi-body">
        <header className="vi-header">
          <Hamburger onOpen={() => setDrawerOpen(true)} />
          {header}
        </header>
        <main className="vi-main">{main}</main>
        <div className="vi-composer">{composer}</div>
      </div>
    </div>
  );
}
