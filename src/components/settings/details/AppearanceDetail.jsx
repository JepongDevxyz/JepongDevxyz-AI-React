/* AppearanceDetail — DITO nakatira ang Design switcher (inilipat mula sa header):
   9 designs + light/dark + text size + haptics. */
import { Palette, Sun, Moon, Type, Vibrate } from "lucide-react";
import { useDesign, DESIGNS, DESIGN_LABELS } from "../../../state/DesignContext.jsx";
import { useSettings } from "../../../state/SettingsContext.jsx";
import Toggle from "../../ui/Toggle.jsx";

export default function AppearanceDetail({ openDetail }) {
  const { design, setDesign, mode, setMode } = useDesign();
  const { settings, updateSetting, toggleSetting } = useSettings();

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <h3>
          <Palette size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Design
        </h3>
        <p>9 na disenyo — papalitan agad ang buong app.</p>
        <div className="jd-design-grid" role="group" aria-label="Design">
          {DESIGNS.map((d) => (
            <button
              key={d}
              type="button"
              className={`jd-design-cell${design === d ? " is-active" : ""}`}
              onClick={() => setDesign(d)}
            >
              {DESIGN_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="jd-card">
        <h3>Mode</h3>
        <div className="jd-seg" role="group" aria-label="Color mode">
          <button
            type="button"
            className={mode === "dark" ? "is-active" : ""}
            onClick={() => setMode("dark")}
          >
            <Moon size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> Dark
          </button>
          <button
            type="button"
            className={mode === "light" ? "is-active" : ""}
            onClick={() => setMode("light")}
          >
            <Sun size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> Light
          </button>
        </div>
      </div>

      <div className="jd-card">
        <h3>
          <Type size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Laki ng text
        </h3>
        <div className="jd-seg" role="group" aria-label="Text size">
          {[
            ["small", "Maliit"],
            ["medium", "Katamtaman"],
            ["large", "Malaki"],
          ].map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={settings.textSize === v ? "is-active" : ""}
              onClick={() => updateSetting("textSize", v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="jd-card">
        <div className="jd-row" style={{ border: 0, padding: "4px 0" }}>
          <span className="jd-row__icon"><Vibrate size={22} /></span>
          <span className="jd-row__texts">
            <span className="jd-row__label">Haptics</span>
            <span className="jd-row__sub">Vibration feedback — default OFF</span>
          </span>
          <Toggle
            checked={settings.haptics}
            onChange={() => toggleSetting("haptics")}
            label="Haptics"
          />
        </div>
        <button
          type="button"
          className="jd-btn jd-btn--block"
          style={{ marginTop: 10 }}
          onClick={() => openDetail?.("haptics")}
        >
          Haptics settings
        </button>
      </div>
    </div>
  );
}
