/* ChatDetail — default effort, Pure Mode, Instant mode. */
import { MessageSquare, Zap, Gauge } from "lucide-react";
import { useSettings } from "../../../state/SettingsContext.jsx";
import Toggle from "../../ui/Toggle.jsx";

const EFFORTS = [
  ["low", "Mabilis", "Mas mabilis, mas maikli"],
  ["medium", "Balanse", "Gitna ng bilis at lalim"],
  ["high", "Matalino", "Mas malalim, mas mabagal"],
];

export default function ChatDetail() {
  const { settings, updateSetting, toggleSetting } = useSettings();

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <h3>
          <Gauge size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Default effort
        </h3>
        <p>Antas ng pag-iisip sa bawat sagot (puwedeng baguhin per-chat sa composer).</p>
        <div className="jd-seg" role="group" aria-label="Default effort">
          {EFFORTS.map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={settings.effortDefault === v ? "is-active" : ""}
              onClick={() => updateSetting("effortDefault", v)}
              title={EFFORTS.find((e) => e[0] === v)[2]}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="jd-card">
        <div className="jd-row" style={{ border: 0, padding: "4px 0 12px" }}>
          <span className="jd-row__icon"><Zap size={22} /></span>
          <span className="jd-row__texts">
            <span className="jd-row__label">Pure Mode</span>
            <span className="jd-row__sub">Diretsong sagot, walang palamuti — default OFF</span>
          </span>
          <Toggle
            checked={settings.pureMode}
            onChange={() => toggleSetting("pureMode")}
            label="Pure Mode"
          />
        </div>
        <div className="jd-row" style={{ border: 0, padding: "4px 0" }}>
          <span className="jd-row__icon"><MessageSquare size={22} /></span>
          <span className="jd-row__texts">
            <span className="jd-row__label">Instant mode</span>
            <span className="jd-row__sub">Pinakamabilis na sagot (low effort) — default OFF</span>
          </span>
          <Toggle
            checked={settings.instantMode}
            onChange={() => toggleSetting("instantMode")}
            label="Instant mode"
          />
        </div>
      </div>
    </div>
  );
}
