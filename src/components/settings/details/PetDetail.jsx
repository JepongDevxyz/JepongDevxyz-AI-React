/* PetDetail — virtual pet companion (tunay na handlers: feed/play, happiness meter). */
import { PawPrint, Drumstick, Gamepad2 } from "lucide-react";
import { useSettings } from "../../../state/SettingsContext.jsx";
import { useToast } from "../../../state/ToastContext.jsx";
import Toggle from "../../ui/Toggle.jsx";

function moodOf(h) {
  if (h >= 80) return "Sobrang saya!";
  if (h >= 60) return "Masaya";
  if (h >= 40) return "Okay lang";
  if (h >= 20) return "Medyo malungkot";
  return "Kailangan ng atensyon";
}

export default function PetDetail() {
  const { settings, updateSetting, toggleSetting } = useSettings();
  const { toast } = useToast();

  const h = Math.max(0, Math.min(100, Number(settings.petHappiness) || 0));

  const bump = (delta, label) => {
    updateSetting("petHappiness", Math.max(0, Math.min(100, h + delta)));
    toast(label);
    try {
      if (settings.haptics && navigator.vibrate) navigator.vibrate(15);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <div className="jd-row" style={{ border: 0, padding: "4px 0 12px" }}>
          <span className="jd-row__icon"><PawPrint size={22} /></span>
          <span className="jd-row__texts">
            <span className="jd-row__label">Pet companion</span>
            <span className="jd-row__sub">Default OFF — buksan para magkaroon ng kasama</span>
          </span>
          <Toggle
            checked={settings.petEnabled}
            onChange={() => toggleSetting("petEnabled")}
            label="Pet companion"
          />
        </div>

        {settings.petEnabled ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <span
                className="sb-account__avatar"
                style={{ width: 52, height: 52, fontSize: 24 }}
                aria-hidden="true"
              >
                <PawPrint size={26} />
              </span>
              <div style={{ flex: 1 }}>
                <input
                  className="jd-input"
                  value={settings.petName}
                  onChange={(e) => updateSetting("petName", e.target.value.slice(0, 24))}
                  maxLength={24}
                  aria-label="Pet name"
                  style={{ fontWeight: 700 }}
                />
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{moodOf(h)}</div>
              </div>
            </div>
            <div className="jd-pet-meter" role="progressbar" aria-valuenow={h} aria-valuemin={0} aria-valuemax={100}>
              <div className="jd-pet-meter__fill" style={{ width: `${h}%` }} />
            </div>
            <div className="jd-btnrow">
              <button type="button" className="jd-btn" onClick={() => bump(10, `${settings.petName} ay kumain! +10`)}>
                <Drumstick size={15} /> Pakainin
              </button>
              <button type="button" className="jd-btn" onClick={() => bump(15, `Nakipaglaro si ${settings.petName}! +15`)}>
                <Gamepad2 size={15} /> Makipaglaro
              </button>
            </div>
          </>
        ) : (
          <p>Buksan ang toggle para makilala ang iyong pet companion.</p>
        )}
      </div>
    </div>
  );
}
