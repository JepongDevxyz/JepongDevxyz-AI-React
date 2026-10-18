/* HapticsDetail — haptics master toggle + intensity + test. */
import { Vibrate } from "lucide-react";
import { useSettings } from "../../../state/SettingsContext.jsx";
import { useToast } from "../../../state/ToastContext.jsx";
import Toggle from "../../ui/Toggle.jsx";
import { useState } from "react";

const PATTERNS = { light: 15, medium: 40, strong: [60, 40, 60] };

export default function HapticsDetail() {
  const { settings, updateSetting, toggleSetting } = useSettings();
  const { toast } = useToast();
  const [intensity, setIntensity] = useState("medium");

  const test = () => {
    try {
      if (!navigator.vibrate) {
        toast("Hindi suportado ang vibration sa device na ito");
        return;
      }
      navigator.vibrate(PATTERNS[intensity] || 40);
      toast("Haptics test");
    } catch {
      toast("Hindi gumana ang vibration");
    }
  };

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <div className="jd-row" style={{ border: 0, padding: "4px 0 12px" }}>
          <span className="jd-row__icon"><Vibrate size={22} /></span>
          <span className="jd-row__texts">
            <span className="jd-row__label">Haptics</span>
            <span className="jd-row__sub">Vibration feedback sa mga tap — default OFF</span>
          </span>
          <Toggle
            checked={settings.haptics}
            onChange={() => toggleSetting("haptics")}
            label="Haptics"
          />
        </div>
      </div>

      <div className="jd-card">
        <h3>Lakas</h3>
        <div className="jd-seg" role="group" aria-label="Haptics intensity">
          {["light", "medium", "strong"].map((v) => (
            <button
              key={v}
              type="button"
              className={intensity === v ? "is-active" : ""}
              onClick={() => {
                setIntensity(v);
                updateSetting("haptics", true);
              }}
            >
              {v === "light" ? "Mahina" : v === "medium" ? "Katamtaman" : "Malakas"}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="jd-btn jd-btn--block" onClick={test}>
        <Vibrate size={15} /> Subukan
      </button>
    </div>
  );
}
