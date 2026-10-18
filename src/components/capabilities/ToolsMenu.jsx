/* ToolsMenu — Phase 5 entry point ng 9 capabilities.
   ToolsButton: icon button (chat header, lahat ng 9 shells via HeaderPlaceholder)
   ToolsMenuSheet: bottom sheet na may 9 items; bawat isa nagbubukas ng panel.
   Sa Composer (+) popup: idagdag ang "Tools" row na tumatawag sa openMenu(). */
import {
  ListChecks, Braces, FilePenLine, Telescope, Download, ImagePlus,
  MapPin, Globe, Paperclip, Wrench,
} from "lucide-react";
import Sheet from "../ui/Sheet.jsx";
import { useTools } from "../../state/ToolsContext.jsx";

export const TOOLS = [
  { id: "todos", label: "Todos", desc: "Simple todo list — naka-save sa device", icon: ListChecks },
  { id: "js", label: "JS Runner", desc: "Patakbuhin ang JavaScript (sandboxed)", icon: Braces },
  { id: "editor", label: "File Editor", desc: "Magsulat at mag-save ng text files", icon: FilePenLine },
  { id: "research", label: "Deep Research", desc: "Multi-step research na may citations", icon: Telescope },
  { id: "export", label: "Export", desc: "HTML / Markdown / TXT (+ office via server)", icon: Download },
  { id: "imagine", label: "Image Gen", desc: "Gumawa ng image mula sa prompt", icon: ImagePlus },
  { id: "maps", label: "Maps", desc: "Maghanap ng lugar sa mapa", icon: MapPin },
  { id: "websearch", label: "Web Search", desc: "Mag-search sa web na may citations", icon: Globe },
  { id: "upload", label: "Upload", desc: "Mag-attach ng file/image sa chat", icon: Paperclip },
];

/* Icon button para sa chat header (HeaderPlaceholder — lahat ng 9 shells). */
export function ToolsButton() {
  const { openMenu } = useTools();
  return (
    <button
      type="button"
      className="jd-icon-btn"
      aria-label="Tools"
      title="Tools — Todos, JS runner, editor, research…"
      onClick={openMenu}
    >
      <Wrench size={19} strokeWidth={1.8} />
    </button>
  );
}

/* Ang 9-item menu sheet. */
export function ToolsMenuSheet({ onClose, onPick }) {
  return (
    <Sheet open onClose={onClose} title="Tools">
      <div className="jd-tools-grid">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="jd-tool-row"
            onClick={() => onPick?.(t.id)}
          >
            <span className="jd-tool-row__icon">
              <t.icon size={20} strokeWidth={1.9} />
            </span>
            <span className="jd-tool-row__text">
              <span className="jd-tool-row__label">{t.label}</span>
              <span className="jd-tool-row__desc">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="jd-tools-note">
        Lahat ng tools ay gumagana on-device; ang AI tools (Research, Image Gen,
        Web Search) ay nangangailangan ng koneksyon sa backend.
      </div>
    </Sheet>
  );
}
