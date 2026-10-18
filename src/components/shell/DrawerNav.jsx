/* DrawerNav — shared mobile navigation for all shells.
   Hamburger (visible only <=900px via CSS) opens the shell's sidebar
   as a fixed overlay drawer. Backdrop tap closes it.
   Usage in a shell:
     const [drawerOpen, setDrawerOpen] = useState(false);
     <div className={`shell shell-x${drawerOpen ? " nav-open" : ""}`}>
       <Hamburger onOpen={() => setDrawerOpen(true)} />
       {drawerOpen && <DrawerBackdrop onClose={() => setDrawerOpen(false)} />}
       ...
     </div>
   CSS in shells.css drives .jd-hamburger visibility and
   .nav-open sidebar overlay for every shell. */
import { Menu } from "lucide-react";

export function Hamburger({ onOpen, label = "Open menu" }) {
  return (
    <button
      type="button"
      className="jd-hamburger jd-icon-btn"
      aria-label={label}
      onClick={onOpen}
    >
      <Menu size={22} strokeWidth={1.8} />
    </button>
  );
}

export function DrawerBackdrop({ onClose }) {
  return (
    <div
      className="jd-drawer-backdrop"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}
