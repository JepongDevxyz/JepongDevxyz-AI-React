/* PersonalizationDetail — ChatGPT-style personalization. */
import { useState } from "react";
import { useSettings } from "../../../state/SettingsContext.jsx";
import { useToast } from "../../../state/ToastContext.jsx";

export default function PersonalizationDetail() {
  const { settings, updateSetting } = useSettings();
  const { toast } = useToast();
  const [name, setName] = useState(settings.userName || "");
  const [instructions, setInstructions] = useState(settings.customInstructions || "");
  const [lang, setLang] = useState(settings.responseLanguage || "auto");

  const save = () => {
    updateSetting("userName", name.slice(0, 40));
    updateSetting("customInstructions", instructions.slice(0, 2000));
    updateSetting("responseLanguage", lang);
    toast("Na-save ang personalization");
  };

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <h3>Tungkol sa iyo</h3>
        <p>Para mas personal ang mga sagot — tatawagin ka sa pangalan mo at susundin ang istilo mo.</p>
        <div className="jd-field">
          <label htmlFor="jd-pname">Ano ang itatawag sa iyo?</label>
          <input
            id="jd-pname"
            className="jd-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jepong"
            maxLength={40}
          />
        </div>
        <div className="jd-field">
          <label htmlFor="jd-lang">Wika ng sagot</label>
          <div className="jd-seg" role="group" aria-label="Response language">
            {[
              ["auto", "Auto"],
              ["tl", "Tagalog"],
              ["en", "English"],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={lang === v ? "is-active" : ""}
                onClick={() => setLang(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="jd-card">
        <h3>Custom instructions</h3>
        <p>Ano ang dapat tandaan ni JepongDevxyz AI sa bawat sagot? (hal. "maikli lang", "may halimbawa palagi")</p>
        <div className="jd-field">
          <textarea
            className="jd-textarea"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Hal. Sumagot nang maikli at diretso sa punto…"
            maxLength={2000}
          />
        </div>
      </div>

      <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={save}>
        I-save
      </button>
    </div>
  );
}
