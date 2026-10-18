/* VoiceDetail — voice persona + voice enable toggle + test speech. */
import { Mic, Volume2 } from "lucide-react";
import { useSettings } from "../../../state/SettingsContext.jsx";
import { useToast } from "../../../state/ToastContext.jsx";
import Toggle from "../../ui/Toggle.jsx";

const PERSONAS = [
  "JepongDevxyz AI",
  "Kuya",
  "Ate",
  "Narrator",
  "Robot",
];

export default function VoiceDetail() {
  const { settings, updateSetting, toggleSetting } = useSettings();
  const { toast } = useToast();

  const testVoice = () => {
    try {
      const text = `Kumusta! Ako si ${settings.voicePersona}. Handa na akong magsalita para sa iyo.`;
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = /[ñÑ]/.test(text) ? "fil-PH" : "en-US";
      speechSynthesis.speak(utter);
      toast("Tine-test ang boses…");
    } catch {
      toast("Hindi suportado ang speech sa device na ito");
    }
  };

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <div className="jd-row" style={{ border: 0, padding: "4px 0 12px" }}>
          <span className="jd-row__icon"><Mic size={22} /></span>
          <span className="jd-row__texts">
            <span className="jd-row__label">Voice</span>
            <span className="jd-row__sub">Boses sa pagsagot at voice notes — default OFF</span>
          </span>
          <Toggle
            checked={settings.voiceEnabled}
            onChange={() => toggleSetting("voiceEnabled")}
            label="Voice enabled"
          />
        </div>
      </div>

      <div className="jd-card">
        <h3>Voice persona</h3>
        <p>Persona ng boses sa voice-note bubbles ([[JD_AUDIO]]).</p>
        <div className="jd-seg" role="group" aria-label="Voice persona" style={{ flexWrap: "wrap" }}>
          {PERSONAS.map((p) => (
            <button
              key={p}
              type="button"
              className={settings.voicePersona === p ? "is-active" : ""}
              onClick={() => updateSetting("voicePersona", p)}
              style={{ flex: "1 1 30%" }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="jd-btn jd-btn--block" onClick={testVoice}>
        <Volume2 size={15} /> Subukan ang boses
      </button>
    </div>
  );
}
