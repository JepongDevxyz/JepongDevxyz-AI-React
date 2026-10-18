/* Sidebar — tunay na sidebar content (Phase 3, pumapalit sa SimpleNav).
   Account row, quick menu, conversations (2-line titles, search, pin,
   long-press/right-click Rename·Pin·Delete), incognito section,
   footer (ping, Words pill, search, Settings, New chat), import .zip. */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Compass,
  FolderOpen,
  Blocks,
  Trash2,
  Upload,
  Search,
  Pin,
  EyeOff,
  Settings,
  Pencil,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useChat } from "../../state/ChatContext.jsx";
import { useSettings } from "../../state/SettingsContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import Modal from "../ui/Modal.jsx";
import NotificationBell from "../extras/NotificationBell.jsx";
import { openExplore } from "../feed/ExploreTabs.jsx";
import { importChatZip } from "./importChats.js";
import "./sidebar.css";

function fmtDate(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function wordCountOf(session) {
  if (!session) return 0;
  return (session.messages || []).reduce((n, m) => {
    const w = String(m.content || "").trim().split(/\s+/).filter(Boolean).length;
    return n + w;
  }, 0);
}

function twoLine(session) {
  const title = session.title || "Bagong chat";
  const n = (session.messages || []).length;
  const sub = `${fmtDate(session.createdAt)} · ${n} mensahe`;
  return { title, sub };
}

export default function Sidebar({ onOpenSettings }) {
  const {
    sessions,
    activeSession,
    selectSession,
    newSession,
    renameSession,
    pinSession,
    deleteSession,
    clearSession,
    importSessions,
  } = useChat();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(null); // {x, y, id, confirmDelete}
  const [renameId, setRenameId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);
  const searchRef = useRef(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Isara ang context menu kapag nag-click sa labas / nag-scroll
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  const normal = useMemo(
    () =>
      sessions
        .filter((s) => !s.incognito)
        .sort((a, b) => {
          if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        }),
    [sessions]
  );
  const incognitoList = useMemo(
    () =>
      sessions
        .filter((s) => s.incognito)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [sessions]
  );

  const q = query.trim().toLowerCase();
  const filtered = q
    ? normal.filter((s) => (s.title || "").toLowerCase().includes(q))
    : normal;

  const openMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX || 0, window.innerWidth - 190);
    const y = Math.min(e.clientY || 0, window.innerHeight - 170);
    setMenu({ x: Math.max(8, x), y: Math.max(8, y), id, confirmDelete: false });
  };

  const startLongPress = (e, id) => {
    // Touch long-press (~550ms) → context menu
    if (e.touches && e.touches.length === 1) {
      const t = e.touches[0];
      longPressTimer.current = setTimeout(() => {
        openMenu({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => {}, stopPropagation: () => {} }, id);
      }, 550);
    }
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const doRename = () => {
    const id = menu?.id;
    const s = sessions.find((x) => x.id === id);
    setMenu(null);
    if (!s) return;
    setRenameId(id);
    setRenameText(s.title || "");
  };

  const submitRename = () => {
    if (renameId && renameText.trim()) renameSession(renameId, renameText.trim());
    setRenameId(null);
    setRenameText("");
  };

  const doPin = () => {
    if (menu?.id) pinSession(menu.id);
    setMenu(null);
  };

  const doDelete = () => {
    if (!menu?.id) return;
    if (!menu.confirmDelete) {
      setMenu({ ...menu, confirmDelete: true });
      return;
    }
    deleteSession(menu.id);
    setMenu(null);
    toast("Nabura ang chat");
  };

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const { sessions: list, format } = await importChatZip(file);
      const n = importSessions(list);
      toast(`Na-import ang ${n} chat (${format.replace("parse", "")})`);
    } catch (err) {
      toast(`Import failed: ${err?.message || "hindi mabasa ang zip"}`);
    } finally {
      setImporting(false);
    }
  };

  const accountName = settings.userName || settings.accountEmail?.split("@")[0] || "Guest";
  const initial = (accountName.trim()[0] || "G").toUpperCase();
  const words = wordCountOf(activeSession);

  const quickItem = (Icon, label, onClick, extra) => (
    <button key={label} type="button" className="sb-quick__item" onClick={onClick} {...extra}>
      <Icon size={17} strokeWidth={1.9} />
      <span>{label}</span>
    </button>
  );

  const renderSession = (s) => {
    const { title, sub } = twoLine(s);
    const active = activeSession?.id === s.id;
    return (
      <button
        key={s.id}
        type="button"
        className={`sb-conv${active ? " is-active" : ""}`}
        onClick={() => selectSession(s.id)}
        onContextMenu={(e) => openMenu(e, s.id)}
        onTouchStart={(e) => startLongPress(e, s.id)}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        title={title}
      >
        {s.pinned ? <Pin size={13} className="sb-conv__pin" /> : null}
        <span className="sb-conv__texts">
          <span className="sb-conv__title">{title}</span>
          <span className="sb-conv__sub">{sub}</span>
        </span>
        {s.incognito ? <EyeOff size={13} className="sb-conv__incog" /> : null}
      </button>
    );
  };

  return (
    <div className="sb">
      {/* Account row */}
      <button
        type="button"
        className="sb-account"
        onClick={() => onOpenSettings?.("account")}
        aria-label="Account settings"
      >
        <span className="sb-account__avatar" aria-hidden="true">{initial}</span>
        <span className="sb-account__texts">
          <span className="sb-account__name">{accountName}</span>
          <span className="sb-account__plan">Free plan</span>
        </span>
      </button>

      {/* Quick menu */}
      <nav className="sb-quick" aria-label="Quick menu">
        {quickItem(Plus, "New chat", () => newSession())}
        {quickItem(Compass, "Explore", () => openExplore("feed"))}
        {quickItem(FolderOpen, "Library", () => onOpenSettings?.("library"))}
        {quickItem(Blocks, "Plugins", () => onOpenSettings?.("connectors"))}
        {quickItem(Trash2, "Clear chat", () => {
          clearSession();
          toast("Na-clear ang kasalukuyang chat");
        })}
        {quickItem(Upload, importing ? "Nag-i-import…" : "Import chats", () => fileRef.current?.click())}
      </nav>
      <input
        ref={fileRef}
        type="file"
        accept=".zip,application/zip"
        style={{ display: "none" }}
        onChange={handleImportFile}
        aria-label="Import chats zip file"
      />

      {/* Search */}
      <div className="sb-search">
        <Search size={15} strokeWidth={2} />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hanapin ang chats…"
          aria-label="Search conversations"
        />
        {query ? (
          <button type="button" className="sb-search__clear" onClick={() => setQuery("")} aria-label="Clear search">
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Conversations */}
      <div className="sb-list" role="list" aria-label="Conversations">
        {filtered.length === 0 ? (
          <div className="sb-empty">{q ? "Walang nahanap." : "Wala pang chat."}</div>
        ) : (
          filtered.map(renderSession)
        )}

        {incognitoList.length > 0 ? (
          <>
            <div className="sb-section-label">
              <EyeOff size={12} /> Incognito — hindi nase-save
            </div>
            {incognitoList.map(renderSession)}
          </>
        ) : null}
      </div>

      {/* Footer */}
      <div className="sb-footer">
        <span className="sb-ping" title={online ? "Online" : "Offline"}>
          {online ? <Wifi size={13} className="sb-ping__dot is-on" /> : <WifiOff size={13} className="sb-ping__dot" />}
        </span>
        <span className="sb-words" title="Words sa kasalukuyang chat">{words} words</span>
        <span className="sb-footer__spacer" />
        <NotificationBell />
        <button
          type="button"
          className="jd-icon-btn"
          aria-label="Search chats"
          title="Search chats"
          onClick={() => searchRef.current?.focus()}
        >
          <Search size={17} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          className="jd-icon-btn"
          aria-label="Settings"
          title="Settings"
          onClick={() => onOpenSettings?.()}
        >
          <Settings size={17} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          className="jd-icon-btn"
          aria-label="New chat"
          title="New chat"
          onClick={() => newSession()}
        >
          <Plus size={17} strokeWidth={1.9} />
        </button>
      </div>

      {/* Context menu: Rename / Pin / Delete */}
      {menu ? (
        <div
          className="sb-ctx"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {menu.confirmDelete ? (
            <>
              <div className="sb-ctx__label">Burahin ang chat na ito?</div>
              <button type="button" className="sb-ctx__item is-danger" onClick={doDelete}>
                <Trash2 size={15} /> Oo, burahin
              </button>
              <button type="button" className="sb-ctx__item" onClick={() => setMenu(null)}>
                <X size={15} /> Kanselahin
              </button>
            </>
          ) : (
            <>
              <button type="button" className="sb-ctx__item" onClick={doRename}>
                <Pencil size={15} /> Rename
              </button>
              <button type="button" className="sb-ctx__item" onClick={doPin}>
                <Pin size={15} />
                {sessions.find((s) => s.id === menu.id)?.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                className="sb-ctx__item is-danger"
                onClick={doDelete}
              >
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* Rename modal */}
      <Modal open={!!renameId} onClose={() => setRenameId(null)} title="Rename chat">
        <input
          className="sb-input"
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
          }}
          maxLength={80}
          autoFocus
          aria-label="Chat title"
        />
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <button type="button" className="sb-btn" onClick={() => setRenameId(null)}>
            Kanselahin
          </button>
          <button type="button" className="sb-btn sb-btn--primary" onClick={submitRename}>
            I-save
          </button>
        </div>
      </Modal>
    </div>
  );
}
