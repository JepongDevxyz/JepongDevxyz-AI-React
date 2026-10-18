/* SettingsView — Settings v3 (Phase 3).
   - Credits card sa taas (balance + Top-up — theme-synced, never yellow; modal = Phase 4)
   - 22 rows grouped sa sections: Account, Appearance, Chat, Voice, AI & Tools, Connectors, Extra, About
   - Version footer
   - Bawat row → detail view; back = TOTALLY UNMOUNT (conditional render, hindi CSS display) */
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  X,
  ChevronRight,
  User,
  Smile,
  FolderOpen,
  Database,
  PawPrint,
  Mic,
  Palette,
  Vibrate,
  MessageSquare,
  Cpu,
  KeyRound,
  Upload,
  Plug,
  Filter,
  History,
  Globe2,
  UserPlus,
  Save,
  FileText,
  Shield,
  Receipt,
  Trash2,
} from "lucide-react";
import { useSettings } from "../../state/SettingsContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import { useCredits } from "../../state/CreditsContext.jsx";
import Toggle from "../ui/Toggle.jsx";
import Sheet from "../ui/Sheet.jsx";
import { useChat } from "../../state/ChatContext.jsx";
import { importChatZip } from "../sidebar/importChats.js";
import { backupChats } from "./backup.js";
import AccountDetail from "./details/AccountDetail.jsx";
import PersonalizationDetail from "./details/PersonalizationDetail.jsx";
import MemoryDetail from "./details/MemoryDetail.jsx";
import PetDetail from "./details/PetDetail.jsx";
import VoiceDetail from "./details/VoiceDetail.jsx";
import AppearanceDetail from "./details/AppearanceDetail.jsx";
import HapticsDetail from "./details/HapticsDetail.jsx";
import ChatDetail from "./details/ChatDetail.jsx";
import AIToolsDetail from "./details/AIToolsDetail.jsx";
import LegalDetail from "./details/LegalDetail.jsx";
import CredentialVault from "./CredentialVault.jsx";
import SignupAgent from "./SignupAgent.jsx";
import LibraryView from "./LibraryView.jsx";
import UsagePanel from "../credits/UsagePanel.jsx";
import TopUpModal from "../credits/TopUpModal.jsx";
import ConnectorsPanel from "../connectors/ConnectorsPanel.jsx";
import ExtraInfoSheet from "./ExtraInfoSheet.jsx";
import "./settings.css";

/* detail key → { title, Component } */
const DETAILS = {
  account: { title: "Account", C: AccountDetail },
  personalization: { title: "Personalization", C: PersonalizationDetail },
  library: { title: "Library", C: LibraryView },
  memory: { title: "Memory", C: MemoryDetail },
  pet: { title: "Pet", C: PetDetail },
  appearance: { title: "Appearance", C: AppearanceDetail },
  haptics: { title: "Haptics", C: HapticsDetail },
  chat: { title: "Chat", C: ChatDetail },
  voice: { title: "Voice", C: VoiceDetail },
  aitools: { title: "AI & Tools", C: AIToolsDetail },
  vault: { title: "Credential Vault", C: CredentialVault },
  signup: { title: "Signup Agent", C: SignupAgent },
  usage: { title: "Usage", C: UsagePanel },
  connectors: { title: "Connectors", C: ConnectorsPanel },
  "legal-terms": { title: "Terms of Service", C: (p) => <LegalDetail doc="terms" {...p} /> },
  "legal-privacy": { title: "Privacy Policy", C: (p) => <LegalDetail doc="privacy" {...p} /> },
  "legal-refund": { title: "Refund Policy", C: (p) => <LegalDetail doc="refund" {...p} /> },
};

export default function SettingsView({ initialDetail = null, onClose }) {
  // detail === null → home. Pag nag-back, TOTALLY UNMOUNT (conditional render).
  const [detail, setDetail] = useState(initialDetail && DETAILS[initialDetail] ? initialDetail : null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [extraInfoKey, setExtraInfoKey] = useState(null);
  const [connectorFocus, setConnectorFocus] = useState(null);
  const { settings, toggleSetting } = useSettings();
  const { toast } = useToast();
  const { balance } = useCredits();
  const { importSessions } = useChat();
  const importRef = useRef(null);

  // Kapag nagbago ang initialDetail mula sa labas (hal. sidebar), buksan ito
  useEffect(() => {
    if (initialDetail && DETAILS[initialDetail]) setDetail(initialDetail);
  }, [initialDetail]);

  // Library cloud rows (Drive/Dropbox) → buksan ang Connectors detail na naka-focus
  useEffect(() => {
    const onLibConn = (e) => {
      setConnectorFocus(e?.detail?.focus || null);
      setDetail("connectors");
    };
    window.addEventListener("jd:library-open-connectors", onLibConn);
    return () => window.removeEventListener("jd:library-open-connectors", onLibConn);
  }, []);

  const openDetail = (key) => {
    if (DETAILS[key]) setDetail(key);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const { sessions, format } = await importChatZip(file);
      const n = importSessions(sessions);
      toast(`Na-import ang ${n} chat (${format.replace("parse", "")})`);
    } catch (err) {
      toast(`Import failed: ${err?.message || "hindi mabasa ang zip"}`);
    } finally {
      setImporting(false);
    }
  };

  const doBackup = () => {
    try {
      const { name, sessions } = backupChats();
      toast(`Na-download ang backup (${sessions} chats): ${name}`);
    } catch (err) {
      toast(`Backup failed: ${err?.message || "error"}`);
    }
    setBackupOpen(false);
  };

  const doClearCache = () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("jai_cache_")) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      toast(keys.length ? `Na-clear ang cache (${keys.length})` : "Walang cache na naka-save");
    } catch {
      toast("Hindi ma-clear ang cache");
    }
  };

  /* Row builders */
  const navRow = (Icon, label, sub, key) => (
    <button key={key || label} type="button" className="jd-row" onClick={() => openDetail(key)}>
      <span className="jd-row__icon"><Icon size={22} /></span>
      <span className="jd-row__texts">
        <span className="jd-row__label">{label}</span>
        {sub ? <span className="jd-row__sub">{sub}</span> : null}
      </span>
      <ChevronRight size={18} className="jd-row__chev" />
    </button>
  );

  /* Extra toggle row — hindi dead: tap ang row → info sheet (tunay na effect
     o "coming soon"); ang toggle mismo ay stopPropagation. */
  const toggleRow = (Icon, label, sub, key) => (
    <div
      key={key}
      className="jd-row"
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={() => setExtraInfoKey(key)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExtraInfoKey(key);
        }
      }}
      aria-label={`${label} — tungkol dito`}
    >
      <span className="jd-row__icon"><Icon size={22} /></span>
      <span className="jd-row__texts">
        <span className="jd-row__label">{label}</span>
        {sub ? <span className="jd-row__sub">{sub}</span> : null}
      </span>
      <span onClick={(e) => e.stopPropagation()}>
        <Toggle checked={!!settings[key]} onChange={() => toggleSetting(key)} label={label} />
      </span>
    </div>
  );

  const actionRow = (Icon, label, sub, onClick, danger = false) => (
    <button key={label} type="button" className={`jd-row${danger ? " danger" : ""}`} onClick={onClick}>
      <span className="jd-row__icon"><Icon size={22} /></span>
      <span className="jd-row__texts">
        <span className="jd-row__label">{label}</span>
        {sub ? <span className="jd-row__sub">{sub}</span> : null}
      </span>
      {!danger ? <ChevronRight size={18} className="jd-row__chev" /> : null}
    </button>
  );

  const section = (label, rows) => (
    <div key={label}>
      <div className="jd-sec-label">{label}</div>
      <div className="jd-group">{rows}</div>
    </div>
  );

  const active = detail ? DETAILS[detail] : null;
  const DetailComp = active?.C;

  return (
    <div className="jd-settings" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="jd-settings__head">
        {detail ? (
          <button
            type="button"
            className="jd-icon-btn"
            aria-label="Back to Settings"
            onClick={() => setDetail(null)}
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span style={{ width: 38 }} />
        )}
        <h2 className="jd-settings__title">{active ? active.title : "Settings"}</h2>
        <button
          type="button"
          className="jd-icon-btn"
          aria-label="Close settings"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="jd-settings__scroll">
        <div className="jd-settings__col">
          {active && DetailComp ? (
            /* DETAIL — naka-mount lang kapag bukas; pag back, totally unmount */
            detail === "connectors" ? (
              <ConnectorsPanel focusId={connectorFocus} />
            ) : (
              <DetailComp openDetail={openDetail} />
            )
          ) : (
            <>
              {/* Credits card — Phase 4: TopUpModal + UsagePanel */}
              <div className="jd-credits">
                <div className="jd-credits__row">
                  <span className="jd-credits__label">Credits</span>
                  <span className="jd-credits__bal">
                    {balance === null ? "—" : balance.toLocaleString()}
                  </span>
                </div>
                <div className="jd-credits__sub">Balance ng account</div>
                <div className="jd-credits__bar" aria-hidden="true">
                  <div className="jd-credits__fill" style={{ width: balance ? "60%" : "0%" }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="jd-topup"
                    style={{ flex: 1 }}
                    onClick={() => setTopUpOpen(true)}
                  >
                    Top-up
                  </button>
                  <button
                    type="button"
                    className="jd-btn"
                    onClick={() => openDetail("usage")}
                  >
                    Usage
                  </button>
                </div>
              </div>

              {section("Account", [
                navRow(User, "Account", settings.accountEmail || "Hindi naka-login", "account"),
                navRow(Smile, "Personalization", "Pangalan, wika, custom instructions", "personalization"),
                navRow(FolderOpen, "Library", "Saved files, images, cloud", "library"),
                navRow(Database, "Memory", "Memory summary at saved memories", "memory"),
                navRow(PawPrint, "Pet", settings.petEnabled ? `Naka-on — ${settings.petName}` : "Naka-off", "pet"),
              ])}

              {section("Appearance", [
                navRow(Palette, "Appearance", "Design, mode, text size", "appearance"),
                navRow(Vibrate, "Haptics", settings.haptics ? "Naka-on" : "Naka-off", "haptics"),
              ])}

              {section("Chat", [
                navRow(MessageSquare, "Chat", `Effort: ${settings.effortDefault}`, "chat"),
              ])}

              {section("Voice", [
                navRow(Mic, "Voice", settings.voiceEnabled ? `Naka-on — ${settings.voicePersona}` : "Naka-off", "voice"),
              ])}

              {section("AI & Tools", [
                navRow(Cpu, "AI & Tools", "7 toggles + legal", "aitools"),
                navRow(KeyRound, "Credential Vault", "Naka-encrypt na API keys", "vault"),
                actionRow(Upload, importing ? "Nag-i-import…" : "Import Chats", "ChatGPT / Claude / Gemini / Meta AI (.zip)", () => importRef.current?.click()),
              ])}

              {section("Connectors", [
                navRow(Plug, "Connectors", "Gmail, Calendar, Drive…", "connectors"),
              ])}

              {section("Extra", [
                toggleRow(Filter, "Slop Filter", "Anti-slop quality gate", "slopFilter"),
                toggleRow(History, "Tideline Memory", "Client-side long-term memory", "tideline"),
                toggleRow(Globe2, "Agent Browse", "Browse agent (beta)", "agentBrowse"),
                navRow(UserPlus, "Signup Agent", settings.signupAgent ? "Naka-on" : "Naka-off — beta", "signup"),
                toggleRow(Cpu, "Skill Studio", null, "skillStudio"),
                toggleRow(Cpu, "Routine Manager", null, "routineManager"),
                toggleRow(Cpu, "Specialist Dots", null, "specialistDots"),
                toggleRow(Cpu, "Spaces", null, "spaces"),
                toggleRow(Cpu, "Agent Skills", null, "agentSkills"),
                actionRow(Save, "Backup", "I-download ang chats bilang JSON", () => setBackupOpen(true)),
              ])}

              {section("About", [
                navRow(FileText, "Terms of Service", null, "legal-terms"),
                navRow(Shield, "Privacy Policy", null, "legal-privacy"),
                navRow(Receipt, "Refund Policy", "QRPh top-ups: non-refundable", "legal-refund"),
                actionRow(Trash2, "I-clear ang cache", null, doClearCache),
              ])}

              <div className="jd-version">
                JepongDevxyz AI v2.0 · React rebuild
                <br />
                Phase 4 · 2026-10-18
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden import input */}
      <input
        ref={importRef}
        type="file"
        accept=".zip,application/zip"
        style={{ display: "none" }}
        onChange={handleImportFile}
        aria-label="Import chats zip file"
      />

      {/* Top-up modal (Phase 4) */}
      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />

      {/* Extra toggle info sheet — tunay na effect o coming soon */}
      <ExtraInfoSheet infoKey={extraInfoKey} onClose={() => setExtraInfoKey(null)} />

      {/* Backup confirmation sheet */}
      <Sheet open={backupOpen} onClose={() => setBackupOpen(false)} title="Backup">
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
          I-download ang lahat ng chats at settings bilang JSON backup file?
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="jd-btn" onClick={() => setBackupOpen(false)}>
            Kanselahin
          </button>
          <button type="button" className="jd-btn jd-btn--primary" onClick={doBackup}>
            <Save size={15} /> I-download
          </button>
        </div>
      </Sheet>
    </div>
  );
}
