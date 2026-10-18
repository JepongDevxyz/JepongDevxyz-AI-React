/* LibraryView — local library (saved files/images mula sa chats) + cloud rows
   (Drive/Dropbox — connect buttons; OAuth via ConnectorsPanel, Phase 4). */
import { useMemo, useState } from "react";
import { FolderOpen, Image, FileText, Cloud, HardDrive } from "lucide-react";
import { useChat } from "../../state/ChatContext.jsx";
import { useSettings } from "../../state/SettingsContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export default function LibraryView() {
  const { sessions } = useChat();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [tab, setTab] = useState("all"); // all | images | files | cloud

  const items = useMemo(() => {
    const out = [];
    (sessions || []).forEach((s) => {
      (s.messages || []).forEach((m) => {
        (m.attachments || []).forEach((a, i) => {
          out.push({
            id: `${s.id}-${m.id}-${i}`,
            name: a.name || "file",
            mime: a.mimeType || "",
            sessionTitle: s.title || "Chat",
            at: m.at || s.createdAt || Date.now(),
          });
        });
      });
    });
    return out.sort((a, b) => b.at - a.at);
  }, [sessions]);

  const isImage = (mime, name) =>
    (mime || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || "");

  /* Cloud rows → buksan ang ConnectorsPanel na naka-focus sa provider */
  const openConnector = (focus) => {
    window.dispatchEvent(
      new CustomEvent("jd:library-open-connectors", { detail: { focus } })
    );
  };

  const shown = items.filter((it) => {
    if (tab === "images") return isImage(it.mime, it.name);
    if (tab === "files") return !isImage(it.mime, it.name);
    return true;
  });

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <div className="jd-tabs" role="tablist" aria-label="Library tabs">
          {[
            ["all", "Lahat"],
            ["images", "Images"],
            ["files", "Files"],
            ["cloud", "Cloud"],
          ].map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={tab === v}
              className={tab === v ? "is-active" : ""}
              onClick={() => setTab(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "cloud" ? (
          <>
            <div className="jd-lib-item">
              <HardDrive size={18} style={{ color: "var(--muted)" }} />
              <div className="jd-lib-item__meta">
                <div className="jd-lib-item__name">Google Drive</div>
                <div className="jd-lib-item__sub">
                  {settings.driveConnected ? "Naka-connect" : "Hindi pa naka-connect"}
                </div>
              </div>
              <button
                type="button"
                className="jd-btn"
                onClick={() => openConnector("gdrive")}
              >
                <Cloud size={14} /> Connect
              </button>
            </div>
            <div className="jd-lib-item">
              <HardDrive size={18} style={{ color: "var(--muted)" }} />
              <div className="jd-lib-item__meta">
                <div className="jd-lib-item__name">Dropbox</div>
                <div className="jd-lib-item__sub">
                  {settings.dropboxConnected ? "Naka-connect" : "Hindi pa naka-connect"}
                </div>
              </div>
              <button
                type="button"
                className="jd-btn"
                onClick={() => openConnector("dropbox")}
              >
                <Cloud size={14} /> Connect
              </button>
            </div>
          </>
        ) : shown.length === 0 ? (
          <p>
            <FolderOpen size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
            {tab === "all"
              ? "Wala pang naka-save na files o images. Mag-attach sa chat para lumitaw dito."
              : "Walang laman sa tab na ito."}
          </p>
        ) : (
          shown.map((it) => (
            <div key={it.id} className="jd-lib-item">
              {isImage(it.mime, it.name) ? (
                <Image size={18} style={{ color: "var(--muted)" }} />
              ) : (
                <FileText size={18} style={{ color: "var(--muted)" }} />
              )}
              <div className="jd-lib-item__meta">
                <div className="jd-lib-item__name">{it.name}</div>
                <div className="jd-lib-item__sub">
                  {it.sessionTitle} · {fmtDate(it.at)}
                </div>
              </div>
              <button
                type="button"
                className="jd-icon-btn"
                onClick={() => toast("File preview — naka-save lang ang metadata sa Phase 3")}
                aria-label={`Open ${it.name}`}
                title="Info"
              >
                <FileText size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
