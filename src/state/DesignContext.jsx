/* DesignContext — design (9 variants) + mode (dark/light), persisted.
   Sets data-design + data-mode on <html>. */
import { createContext, useContext, useEffect, useState } from "react";

export const DESIGNS = [
  "obsidian-neon",
  "muse-minimal",
  "aurora-glass",
  "midnight-amber",
  "violet-storm",
  "gemini",
  "chatgpt",
  "claude",
  "muse",
];

export const DESIGN_LABELS = {
  "obsidian-neon": "Command Deck",
  "muse-minimal": "Quiet Paper",
  "aurora-glass": "Floating Glass",
  "midnight-amber": "Luxury Noir",
  "violet-storm": "Energy",
  gemini: "Gemini",
  chatgpt: "ChatGPT",
  claude: "Claude",
  muse: "Muse App",
};

const DESIGN_KEY = "jai_design";
const MODE_KEY = "jai_mode";
const DEFAULT_DESIGN = "claude";
const DEFAULT_MODE = "dark";

const DesignContext = createContext(null);

function readStored(key, fallback, valid) {
  try {
    const v = localStorage.getItem(key);
    if (valid.includes(v)) return v;
  } catch {
    /* storage unavailable — fall through */
  }
  return fallback;
}

export function DesignProvider({ children }) {
  const [design, setDesignState] = useState(() =>
    readStored(DESIGN_KEY, DEFAULT_DESIGN, DESIGNS)
  );
  const [mode, setModeState] = useState(() =>
    readStored(MODE_KEY, DEFAULT_MODE, ["dark", "light"])
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-design", design);
    document.documentElement.setAttribute("data-mode", mode);
    try {
      localStorage.setItem(DESIGN_KEY, design);
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* storage unavailable — attributes still set */
    }
  }, [design, mode]);

  const setDesign = (d) => {
    if (DESIGNS.includes(d)) setDesignState(d);
  };

  const setMode = (m) => {
    if (m === "dark" || m === "light") setModeState(m);
  };

  const toggleMode = () => setModeState((m) => (m === "dark" ? "light" : "dark"));

  return (
    <DesignContext.Provider value={{ design, setDesign, mode, setMode, toggleMode }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesign must be used within <DesignProvider>");
  return ctx;
}
