/* App.jsx — DesignProvider + ToastProvider + SettingsProvider + ChatProvider;
   onboarding gate; active shell batay sa design; Phase 3: Sidebar sa nav slot,
   SettingsView overlay, Settings↔Chat bridge (effort/pure/instant). */
import { useEffect, useRef, useState } from "react";
import { DesignProvider, useDesign } from "./state/DesignContext.jsx";
import { ToastProvider } from "./state/ToastContext.jsx";
import { SettingsProvider, useSettings } from "./state/SettingsContext.jsx";
import { CreditsProvider } from "./state/CreditsContext.jsx";
import { ChatProvider, useChat } from "./state/ChatContext.jsx";
import { ToolsProvider } from "./state/ToolsContext.jsx";
import "./components/shell/shells.css";

import ObsidianShell from "./components/shell/ObsidianShell.jsx";
import MinimalShell from "./components/shell/MinimalShell.jsx";
import AuroraShell from "./components/shell/AuroraShell.jsx";
import AmberShell from "./components/shell/AmberShell.jsx";
import VioletShell from "./components/shell/VioletShell.jsx";
import GeminiShell from "./components/shell/GeminiShell.jsx";
import ChatgptShell from "./components/shell/ChatgptShell.jsx";
import ClaudeShell from "./components/shell/ClaudeShell.jsx";
import MuseShell from "./components/shell/MuseShell.jsx";

import { HeaderPlaceholder } from "./components/shell/Placeholders.jsx";
import ChatView from "./components/chat/ChatView.jsx";
import Composer from "./components/chat/Composer.jsx";
import Sidebar from "./components/sidebar/Sidebar.jsx";
import SettingsView from "./components/settings/SettingsView.jsx";
import Onboarding from "./components/Onboarding.jsx";
import ExploreTabs from "./components/feed/ExploreTabs.jsx";
import NotificationCenter from "./components/extras/NotificationCenter.jsx";
import BatteryMonitor from "./components/extras/BatteryMonitor.jsx";
import ProactiveSuite from "./components/extras/ProactiveSuite.jsx";
import GeminiMark from "./components/brand/GeminiMark.jsx";
import ClaudeMark from "./components/brand/ClaudeMark.jsx";

const SHELLS = {
  "obsidian-neon": ObsidianShell,
  "muse-minimal": MinimalShell,
  "aurora-glass": AuroraShell,
  "midnight-amber": AmberShell,
  "violet-storm": VioletShell,
  gemini: GeminiShell,
  chatgpt: ChatgptShell,
  claude: ClaudeShell,
  muse: MuseShell,
};

const CONSENT_KEY = "jai_legal_consent";

/* Shell-specific composer props (brand send marks + placeholders) */
const COMPOSER_PROPS_FOR = {
  gemini: { placeholder: "Ask Gemini", sendIcon: <GeminiMark size={20} />, pill: true },
  chatgpt: { placeholder: "Message ChatGPT", pill: true },
  claude: { placeholder: "Message Claude", sendIcon: <ClaudeMark size={18} /> },
  muse: { placeholder: "Magtanong kay JepongDevxyz AI…" },
};

function readConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

/* Bridge: Settings (chat section) → ChatContext runtime state.
   One-way, skip-first-render (ChatContext nag-load na ng LS sa init). */
function SettingsChatBridge() {
  const { settings } = useSettings();
  const { setEffort, setPureMode, setInstantMode } = useChat();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setEffort(settings.effortDefault);
    setPureMode(settings.pureMode);
    setInstantMode(settings.instantMode);
  }, [settings.effortDefault, settings.pureMode, settings.instantMode, setEffort, setPureMode, setInstantMode]);

  return null;
}

/* Bridge: "jd:goal-chat" (Goals → "Let's do it") at "jd:open-chat-prompt"
   (Feed/Ideas/Connectors → Discuss/Gamitin) — bagong session + prompt na may
   konteksto, ipinapadala agad sa chat. */
function GoalChatBridge() {
  const { newSession, sendMessage } = useChat();

  useEffect(() => {
    const openPrompt = (prompt) => {
      if (!prompt) return;
      const id = newSession();
      // opts.sessionId: direktang i-target ang bagong session (ChatContext)
      sendMessage(prompt, { sessionId: id });
    };
    const onGoal = (e) => {
      const d = e?.detail || {};
      const prompt =
        `Tulungan mo ako sa goal ko: "${d.title || "walang title"}"` +
        (d.description ? `\n\nDetalye: ${d.description}` : "") +
        `\n\nMagsimula tayo sa unang hakbang.`;
      openPrompt(prompt);
    };
    const onPrompt = (e) => openPrompt(e?.detail?.prompt);
    window.addEventListener("jd:goal-chat", onGoal);
    window.addEventListener("jd:open-chat-prompt", onPrompt);
    return () => {
      window.removeEventListener("jd:goal-chat", onGoal);
      window.removeEventListener("jd:open-chat-prompt", onPrompt);
    };
  }, [newSession, sendMessage]);

  return null;
}

function AppInner() {
  const { design } = useDesign();
  const [consented, setConsented] = useState(readConsent);
  // null = sarado; { detail: null | "account" | ... } = bukas
  const [settingsView, setSettingsView] = useState(null);
  // Phase 4: Explore overlay + Notification Center overlay
  const [explore, setExplore] = useState(null); // null | { tab }
  const [notifOpen, setNotifOpen] = useState(false);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    setConsented(true);
  };

  const openSettings = (detail) => setSettingsView({ detail: detail || null });

  // "jd:open-settings" event (hal. ObsidianShell rail Settings button)
  useEffect(() => {
    const onOpen = (e) => openSettings(e?.detail?.detail || null);
    window.addEventListener("jd:open-settings", onOpen);
    return () => window.removeEventListener("jd:open-settings", onOpen);
  }, []);

  // Phase 4: "jd:open-explore" { tab } + "jd:open-notifications"
  useEffect(() => {
    const onExplore = (e) => setExplore({ tab: e?.detail?.tab || "feed" });
    const onNotif = () => setNotifOpen(true);
    window.addEventListener("jd:open-explore", onExplore);
    window.addEventListener("jd:open-notifications", onNotif);
    return () => {
      window.removeEventListener("jd:open-explore", onExplore);
      window.removeEventListener("jd:open-notifications", onNotif);
    };
  }, []);

  if (!consented) {
    return <Onboarding onAccept={accept} />;
  }

  const Shell = SHELLS[design] || ObsidianShell;
  const composerProps = COMPOSER_PROPS_FOR[design] || {};

  return (
    <>
      <SettingsChatBridge />
      <GoalChatBridge />
      <BatteryMonitor />
      <ProactiveSuite />
      <Shell
        nav={<Sidebar onOpenSettings={openSettings} />}
        header={<HeaderPlaceholder />}
        main={<ChatView />}
        composer={<Composer {...composerProps} />}
      />
      {settingsView ? (
        <SettingsView
          initialDetail={settingsView.detail}
          onClose={() => setSettingsView(null)}
        />
      ) : null}
      {explore ? (
        <ExploreTabs
          initialTab={explore.tab}
          onClose={() => setExplore(null)}
        />
      ) : null}
      {notifOpen ? (
        <NotificationCenter onClose={() => setNotifOpen(false)} />
      ) : null}
    </>
  );
}

export default function App() {
  return (
    <DesignProvider>
      <ToastProvider>
        <SettingsProvider>
          <CreditsProvider>
            <ChatProvider>
              <ToolsProvider>
                <AppInner />
              </ToolsProvider>
            </ChatProvider>
          </CreditsProvider>
        </SettingsProvider>
      </ToastProvider>
    </DesignProvider>
  );
}
