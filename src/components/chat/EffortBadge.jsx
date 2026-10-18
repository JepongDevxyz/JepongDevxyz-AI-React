/* EffortBadge.jsx — effort level indicator + selector sheet
   (Low/Medium/High + Pure Mode/Instant toggles). */
import { useState } from "react";
import { Gauge, Check, Zap, Leaf } from "lucide-react";
import { useChat } from "../../state/ChatContext.jsx";
import Sheet from "../ui/Sheet.jsx";
import Toggle from "../ui/Toggle.jsx";

const LEVELS = [
  { id: "low", name: "Low", desc: "Mabilis na sagot, mas kaunting tokens", icon: Leaf },
  { id: "medium", name: "Medium", desc: "Balanse ng bilis at lalim", icon: Gauge },
  { id: "high", name: "High", desc: "Pinakamalalim na pag-iisip", icon: Zap },
];

export default function EffortBadge() {
  const {
    effort, setEffort,
    pureMode, setPureMode,
    instantMode, setInstantMode,
  } = useChat();
  const [open, setOpen] = useState(false);

  const current = LEVELS.find((l) => l.id === effort) || LEVELS[1];

  return (
    <>
      <button
        className="jd-effort"
        type="button"
        onClick={() => setOpen(true)}
        title="Effort level"
      >
        <current.icon />
        {instantMode ? "Instant" : current.name}
        {pureMode ? <span className="jd-effort__dot" aria-label="Pure mode" /> : null}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Effort level">
        <div>
          {LEVELS.map((l) => (
            <button
              key={l.id}
              className="jd-effort__opt"
              type="button"
              onClick={() => {
                setEffort(l.id);
                setOpen(false);
              }}
            >
              <l.icon />
              <span>
                {l.name}
                <small>{l.desc}</small>
              </span>
              {effort === l.id && !instantMode ? (
                <span className="jd-check"><Check /></span>
              ) : null}
            </button>
          ))}

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8 }}>
            <div className="jd-effort__opt" style={{ cursor: "default" }}>
              <Zap />
              <span style={{ flex: 1 }}>
                Instant
                <small>Pinakamabilis — low effort, walang tools</small>
              </span>
              <Toggle checked={instantMode} onChange={setInstantMode} />
            </div>
            <div className="jd-effort__opt" style={{ cursor: "default" }}>
              <Leaf />
              <span style={{ flex: 1 }}>
                Pure Mode
                <small>Walang web search at tools — model lang</small>
              </span>
              <Toggle checked={pureMode} onChange={setPureMode} />
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
