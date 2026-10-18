/* SettingsContext — lahat ng settings bilang isang object.
   BRAND RULE: LAHAT ng toggles OFF by default sa first run.
   Persist sa localStorage (jai_settings_v1). design/mode ay nasa
   DesignContext pa rin (AppearanceDetail gumagamit ng dalawa). */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const LS_SETTINGS = "jai_settings_v1";
const LS_EFFORT = "jai_effort_v1"; // shared key sa ChatContext (iisang source)

/* Lahat ng boolean toggles = false (OFF) sa first run. */
export const DEFAULT_SETTINGS = {
  /* Appearance */
  textSize: "medium", // small | medium | large
  haptics: false,
  /* Chat */
  effortDefault: "medium", // low | medium | high
  pureMode: false,
  instantMode: false,
  /* Voice */
  voiceEnabled: false,
  voicePersona: "JepongDevxyz AI",
  /* AI & Tools — 7 toggles, lahat OFF */
  webSearch: false,
  autoTemper: false,
  responseSpeech: false,
  reconnectNotice: false,
  autoFallback: false,
  smartRouter: false,
  /* Extras — lahat OFF */
  slopFilter: false,
  tideline: false,
  agentBrowse: false,
  skillStudio: false,
  routineManager: false,
  specialistDots: false,
  spaces: false,
  agentSkills: false,
  signupAgent: false,
  /* Proactive + notifications — OFF */
  proactiveBriefing: false,
  proactiveNudges: false,
  proactiveStreaks: false,
  replyNotifications: false,
  /* Account / profile */
  userName: "",
  accountEmail: "",
  customInstructions: "",
  responseLanguage: "auto", // auto | tl | en
  /* Memory */
  memorySummary: "",
  memories: [],
  /* Pet */
  petEnabled: false,
  petName: "Jolly",
  petHappiness: 50,
  /* Library cloud (OAuth = Phase 4) */
  driveConnected: false,
  dropboxConnected: false,
};

const FONT_SIZE_PX = { small: "15px", medium: "16px", large: "17.5px" };

function readStored() {
  let saved = {};
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (raw) saved = JSON.parse(raw) || {};
  } catch {
    saved = {};
  }
  // effortDefault: basahin mula sa shared key ng ChatContext kung wala pa sa settings
  let effort = saved.effortDefault;
  if (!effort) {
    try {
      const e = JSON.parse(localStorage.getItem(LS_EFFORT) || "null");
      if (["low", "medium", "high"].includes(e)) effort = e;
    } catch {
      /* ignore */
    }
  }
  const merged = { ...DEFAULT_SETTINGS, ...saved };
  if (effort) merged.effortDefault = effort;
  // Linisin: tanggalin ang hindi kilalang keys, i-coerce ang booleans
  const clean = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const def = DEFAULT_SETTINGS[key];
    const val = merged[key];
    if (typeof def === "boolean") clean[key] = val === true;
    else if (Array.isArray(def)) clean[key] = Array.isArray(val) ? val : [];
    else clean[key] = val === undefined || val === null ? def : val;
  }
  return clean;
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStored);

  /* Persist buong object */
  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    } catch {
      /* storage unavailable */
    }
  }, [settings]);

  /* Text size → root font-size (gumagana sa rem-based layouts) */
  useEffect(() => {
    try {
      document.documentElement.style.fontSize =
        FONT_SIZE_PX[settings.textSize] || FONT_SIZE_PX.medium;
      document.documentElement.setAttribute(
        "data-jd-textsize",
        settings.textSize || "medium"
      );
    } catch {
      /* ignore */
    }
  }, [settings.textSize]);

  const updateSetting = useCallback((key, value) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return;
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSetting = useCallback((key) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return;
    if (typeof DEFAULT_SETTINGS[key] !== "boolean") return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    try {
      localStorage.removeItem(LS_SETTINGS);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ settings, updateSetting, toggleSetting, resetSettings }),
    [settings, updateSetting, toggleSetting, resetSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}
