/* AIToolsDetail — 7 toggles (lahat OFF by default) + legal rows. */
import {
  Globe,
  Sparkles,
  Ellipsis,
  Volume2,
  Wifi,
  Shuffle,
  Route,
  FileText,
  Shield,
  Receipt,
  ChevronRight,
} from "lucide-react";
import { useSettings } from "../../../state/SettingsContext.jsx";
import Toggle from "../../ui/Toggle.jsx";

const TOGGLES = [
  { key: "webSearch", icon: Globe, label: "Web Search", sub: "Mag-search sa web bago sumagot" },
  { key: "autoTemper", icon: Sparkles, label: "Auto Temper", sub: "Auto-ayusin ang tono ng sagot" },
  { key: "pureMode", icon: Ellipsis, label: "Pure Mode", sub: "Diretsong sagot, walang palamuti" },
  { key: "responseSpeech", icon: Volume2, label: "Response Speech", sub: "Basahin nang malakas ang sagot" },
  { key: "reconnectNotice", icon: Wifi, label: "Reconnect notice", sub: "Abiso kapag bumalik ang connection" },
  { key: "autoFallback", icon: Shuffle, label: "Auto Provider Fallback", sub: "Lumipat ng provider kapag palyado" },
  { key: "smartRouter", icon: Route, label: "Smart Model Router", sub: "Auto-pili ng pinakamagandang model" },
];

export default function AIToolsDetail({ openDetail }) {
  const { settings, toggleSetting } = useSettings();

  return (
    <div className="jd-detail">
      <div className="jd-card" style={{ padding: "6px 0" }}>
        {TOGGLES.map(({ key, icon: Icon, label, sub }) => (
          <div className="jd-row" key={key} style={{ cursor: "default" }}>
            <span className="jd-row__icon"><Icon size={22} /></span>
            <span className="jd-row__texts">
              <span className="jd-row__label">{label}</span>
              <span className="jd-row__sub">{sub}</span>
            </span>
            <Toggle
              checked={!!settings[key]}
              onChange={() => toggleSetting(key)}
              label={label}
            />
          </div>
        ))}
      </div>

      <div className="jd-group" style={{ marginBottom: 0 }}>
        <button type="button" className="jd-row" onClick={() => openDetail?.("legal-terms")}>
          <span className="jd-row__icon"><FileText size={22} /></span>
          <span className="jd-row__texts"><span className="jd-row__label">Terms of Service</span></span>
          <ChevronRight size={18} className="jd-row__chev" />
        </button>
        <button type="button" className="jd-row" onClick={() => openDetail?.("legal-privacy")}>
          <span className="jd-row__icon"><Shield size={22} /></span>
          <span className="jd-row__texts"><span className="jd-row__label">Privacy Policy</span></span>
          <ChevronRight size={18} className="jd-row__chev" />
        </button>
        <button type="button" className="jd-row" onClick={() => openDetail?.("legal-refund")}>
          <span className="jd-row__icon"><Receipt size={22} /></span>
          <span className="jd-row__texts"><span className="jd-row__label">Refund Policy</span></span>
          <ChevronRight size={18} className="jd-row__chev" />
        </button>
      </div>
    </div>
  );
}
