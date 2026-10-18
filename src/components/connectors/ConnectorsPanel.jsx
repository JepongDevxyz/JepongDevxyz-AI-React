/* ConnectorsPanel — Phase 4 (checklist H51).
   Tabs: Connect (grouped 63 entries) | Browse (BrowseViews) | Approvals.
   - Google trio (Gmail/GCalendar/GDrive): OAuth "Connect" buttons —
     PKCE flow laban sa /api/connectors; mock-tolerant: kapag walang backend,
     ipinapakita ang setup state sa halip na mag-fake ng connection.
   - GitHub card: connect + repo list via /api.
   - API-key forms: naka-wire sa CredentialVault (getCredential/saveCredential).
   - Custom Connector builder: name + base URL + auth type → localStorage. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Plug, KeyRound, RefreshCw, ExternalLink, Check, Plus, Trash2, GitBranch } from "lucide-react";
import { useToast } from "../../state/ToastContext.jsx";
import { getCredential, saveCredential, isUnlocked } from "../../api/vault.js";
import {
  connectorStatus,
  connectorOAuthUrl,
  disconnectConnector,
  githubRepos,
  listConnectors,
} from "../../api/connectors.js";
import { CONNECTOR_CATALOG, GROUPS } from "./catalog.js";
import BrowseViews from "./BrowseViews.jsx";
import Sheet from "../ui/Sheet.jsx";
import "./connectors.css";

const LS_CONN = "jai_connectors_v1"; // { id: { connected, at, note } }
const LS_CUSTOM = "jai_custom_connectors_v1"; // [{ id, name, baseUrl, auth }]

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) ?? fallback : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

function initials(name) {
  const parts = String(name).split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function ConnectorsPanel({ focusId = null }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("connect"); // connect | browse | approvals
  const [local, setLocal] = useState(() => readJSON(LS_CONN, {}));
  const [customs, setCustoms] = useState(() => readJSON(LS_CUSTOM, []));
  const [serverSeen, setServerSeen] = useState(false);
  const [checking, setChecking] = useState(null);
  const [apiKeyFor, setApiKeyFor] = useState(null); // connector id na may bukas na form
  const [apiKeyVal, setApiKeyVal] = useState("");
  const [apiKeyBusy, setApiKeyBusy] = useState(false);
  const [githubList, setGithubList] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  // Custom builder form
  const [cName, setCName] = useState("");
  const [cUrl, setCUrl] = useState("");
  const [cAuth, setCAuth] = useState("bearer");
  const focusRef = useRef(null);

  useEffect(() => writeJSON(LS_CONN, local), [local]);
  useEffect(() => writeJSON(LS_CUSTOM, customs), [customs]);

  /* Subukang i-sync ang status mula sa backend (mock-tolerant) */
  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await listConnectors();
      if (!alive) return;
      if (list) {
        setServerSeen(true);
        setLocal((prev) => {
          const next = { ...prev };
          for (const c of list) {
            if (c && c.id) {
              next[c.id] = {
                connected: c.connected === true,
                at: c.connectedAt || next[c.id]?.at || null,
                server: true,
              };
            }
          }
          return next;
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* focusId (hal. galing sa Library cloud rows) → i-scroll ang card */
  useEffect(() => {
    if (focusId && focusRef.current) {
      try {
        focusRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {
        /* ignore */
      }
    }
  }, [focusId]);

  const isConnected = (id) => local[id]?.connected === true;

  const handleOAuth = async (entry) => {
    setChecking(entry.id);
    try {
      const st = await connectorStatus(entry.id);
      if (st && st.connected) {
        setLocal((p) => ({ ...p, [entry.id]: { connected: true, at: Date.now(), server: true } }));
        toast(`${entry.name}: naka-connect na`);
        return;
      }
      if (st && !st.connected) {
        // May backend pero hindi pa naka-connect → buksan ang OAuth authorize
        window.open(connectorOAuthUrl(entry.id), "_blank", "noopener");
        toast(`Binuksan ang ${entry.name} OAuth — tapusin ang pag-connect sa bagong tab`);
        return;
      }
      // Walang backend → setup state (hindi nagpe-fake ng connection)
      setLocal((p) => ({
        ...p,
        [entry.id]: { connected: false, at: null, setupNeeded: true },
      }));
      toast(`${entry.name}: kailangan ng backend — i-setup muna ang /api/connectors`);
    } finally {
      setChecking(null);
    }
  };

  const handleDisconnect = async (entry) => {
    const ok = await disconnectConnector(entry.id);
    setLocal((p) => ({ ...p, [entry.id]: { connected: false, at: null } }));
    toast(ok ? `${entry.name}: na-disconnect` : `${entry.name}: na-disconnect (local)`);
  };

  const loadGithubRepos = async () => {
    setGithubLoading(true);
    const repos = await githubRepos();
    setGithubLoading(false);
    setGithubList(repos); // null = walang backend/setup
  };

  const openApiKeyForm = async (entry) => {
    setApiKeyFor(entry.id);
    setApiKeyVal("");
    // Ipakita kung may naka-save na sa vault
    try {
      const existing = await getCredential(entry.id);
      if (existing) toast(`${entry.name}: may naka-save nang key sa vault`);
    } catch {
      /* vault locked o wala — ok lang */
    }
  };

  const saveApiKey = async () => {
    const entry = CONNECTOR_CATALOG.find((c) => c.id === apiKeyFor);
    if (!entry || !apiKeyVal.trim()) {
      toast("Ilagay ang API key");
      return;
    }
    setApiKeyBusy(true);
    try {
      await saveCredential(entry.id, apiKeyVal.trim());
      setLocal((p) => ({ ...p, [entry.id]: { connected: true, at: Date.now(), via: "vault" } }));
      try {
        localStorage.setItem(`jai_key_configured_${entry.id}`, "1");
      } catch {
        /* ignore */
      }
      toast(`${entry.name}: na-save sa Credential Vault`);
      setApiKeyFor(null);
      setApiKeyVal("");
    } catch (err) {
      toast(`Hindi na-save: ${err?.message || "buksan muna ang vault"}`);
    } finally {
      setApiKeyBusy(false);
    }
  };

  const addCustom = () => {
    const name = cName.trim();
    const url = cUrl.trim();
    if (!name || !url) {
      toast("Kailangan ang name at base URL");
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      toast("Ang base URL ay dapat nagsisimula sa http(s)://");
      return;
    }
    const id = `custom-${Date.now().toString(36)}`;
    setCustoms((p) => [...p, { id, name, baseUrl: url.replace(/\/$/, ""), auth: cAuth }]);
    setCName("");
    setCUrl("");
    toast(`Naidagdag ang custom connector: ${name}`);
  };

  const removeCustom = (id) => {
    setCustoms((p) => p.filter((c) => c.id !== id));
    toast("Tinanggal ang custom connector");
  };

  const allEntries = useMemo(() => {
    const customEntries = customs.map((c) => ({
      id: c.id,
      name: c.name,
      group: "Custom",
      kind: "custom",
      blurb: `${c.baseUrl} · auth: ${c.auth}`,
      _custom: c,
    }));
    return [...CONNECTOR_CATALOG.filter((e) => e.id !== "custom"), ...customEntries];
  }, [customs]);

  const renderEntry = (entry) => {
    const connected = isConnected(entry.id);
    const setupNeeded = local[entry.id]?.setupNeeded && !connected;
    const isFocus = focusId === entry.id;
    return (
      <div
        className="jd-conn-card"
        key={entry.id}
        ref={isFocus ? focusRef : null}
        style={isFocus ? { borderColor: "var(--accent)" } : null}
      >
        <span className="jd-conn-card__icon" aria-hidden="true">
          {entry.id === "github" ? <GitBranch size={19} /> : initials(entry.name)}
        </span>
        <div className="jd-conn-card__meta">
          <div className="jd-conn-card__name">{entry.name}</div>
          <div className="jd-conn-card__blurb">{entry.blurb}</div>
        </div>
        {connected ? (
          <span className="jd-conn-badge is-on">Connected</span>
        ) : setupNeeded ? (
          <span className="jd-conn-badge is-setup">Setup</span>
        ) : null}
        {entry.kind === "oauth" ? (
          connected ? (
            <button type="button" className="jd-btn" onClick={() => handleDisconnect(entry)}>
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              className="jd-btn jd-btn--primary"
              onClick={() => handleOAuth(entry)}
              disabled={checking === entry.id}
            >
              {checking === entry.id ? "…" : (
                <>
                  <Plug size={14} /> Connect
                </>
              )}
            </button>
          )
        ) : entry.kind === "apikey" ? (
          <button type="button" className="jd-btn" onClick={() => openApiKeyForm(entry)}>
            <KeyRound size={14} /> {connected ? "Key ✓" : "API key"}
          </button>
        ) : entry._custom ? (
          <button
            type="button"
            className="jd-icon-btn"
            aria-label={`Tanggalin ${entry.name}`}
            onClick={() => removeCustom(entry.id)}
          >
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
    );
  };

  const githubEntry = CONNECTOR_CATALOG.find((c) => c.id === "github");

  return (
    <div className="jd-detail">
      <div className="jd-conn-tabs" role="tablist" aria-label="Connectors tabs">
        {[
          ["connect", "Connect"],
          ["browse", "Browse"],
          ["approvals", "Approvals"],
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

      {tab === "connect" ? (
        <>
          {!serverSeen ? (
            <p style={{ fontSize: 12, color: "var(--faint)", margin: "0 0 10px" }}>
              Walang nakitang /api/connectors backend — local setup state ang ipinapakita.
              Ang OAuth ay magbubukas ng authorize URL kapag naka-deploy ang server.
            </p>
          ) : null}

          {/* GitHub card na may repo list */}
          <div className="jd-conn-group">
            <div className="jd-conn-group__label">GitHub</div>
            {renderEntry(githubEntry)}
            {isConnected("github") || githubList ? (
              <div className="jd-card" style={{ marginTop: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ fontSize: 13 }}>Mga repository</strong>
                  <button
                    type="button"
                    className="jd-icon-btn"
                    onClick={loadGithubRepos}
                    disabled={githubLoading}
                    aria-label="I-refresh ang repos"
                  >
                    <RefreshCw size={15} className={githubLoading ? "jd-spin" : ""} />
                  </button>
                </div>
                {githubList === null ? (
                  <p>
                    Hindi ma-load ang repos — kailangan ng backend
                    (<code>/api/connectors/github/repos</code>).
                  </p>
                ) : githubList.length === 0 ? (
                  <p>Walang repos na nahanap.</p>
                ) : (
                  githubList.slice(0, 20).map((r) => (
                    <div className="jd-usage-model" key={r.full_name || r.name}>
                      <span className="jd-usage-model__name">{r.full_name || r.name}</span>
                      <a
                        className="jd-usage-model__val"
                        href={r.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--accent)" }}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {/* Grouped entries */}
          {GROUPS.filter((g) => g !== "GitHub" && g !== "Custom").map((group) => {
            const items = allEntries.filter((e) => e.group === group);
            if (!items.length) return null;
            return (
              <div className="jd-conn-group" key={group}>
                <div className="jd-conn-group__label">
                  {group} · {items.length}
                </div>
                {items.map(renderEntry)}
              </div>
            );
          })}

          {/* Custom connector builder */}
          <div className="jd-conn-group">
            <div className="jd-conn-group__label">Custom · {customs.length}</div>
            {allEntries.filter((e) => e.group === "Custom" && e._custom).map(renderEntry)}
            <div className="jd-card">
              <h3>
                <Plus size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
                Custom Connector builder
              </h3>
              <div className="jd-field">
                <label htmlFor="jd-cc-name">Name</label>
                <input
                  id="jd-cc-name"
                  className="jd-input"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="hal. My Internal API"
                />
              </div>
              <div className="jd-field">
                <label htmlFor="jd-cc-url">Base URL</label>
                <input
                  id="jd-cc-url"
                  className="jd-input"
                  value={cUrl}
                  onChange={(e) => setCUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  inputMode="url"
                />
              </div>
              <div className="jd-field">
                <label htmlFor="jd-cc-auth">Auth type</label>
                <select
                  id="jd-cc-auth"
                  className="jd-select"
                  value={cAuth}
                  onChange={(e) => setCAuth(e.target.value)}
                >
                  <option value="bearer">Bearer token</option>
                  <option value="apikey">API key (header)</option>
                  <option value="basic">Basic auth</option>
                  <option value="none">Wala</option>
                </select>
              </div>
              <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={addCustom}>
                <Plus size={15} /> Idagdag
              </button>
              <p className="jd-usage-note">
                Naka-save sa device lang (localStorage). Ang secret ay ilagay sa Credential Vault —
                huwag i-paste dito.
              </p>
            </div>
          </div>
        </>
      ) : null}

      {tab === "browse" ? <BrowseViews /> : null}
      {tab === "approvals" ? <BrowseViews view="approvals" /> : null}

      {/* API-key form sheet — naka-wire sa Credential Vault */}
      <Sheet open={!!apiKeyFor} onClose={() => setApiKeyFor(null)} title="API key">
        {(() => {
          const entry = CONNECTOR_CATALOG.find((c) => c.id === apiKeyFor);
          if (!entry) return null;
          return (
            <>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
                Ang key para sa <strong>{entry.name}</strong> ay mase-save nang naka-encrypt sa
                Credential Vault (AES-GCM). Hindi ito lalabas sa logs.
              </p>
              {!isUnlocked() ? (
                <p style={{ fontSize: 12, color: "var(--accent)", margin: "0 0 12px" }}>
                  Naka-lock ang vault — buksan muna ito sa Settings → Credential Vault.
                </p>
              ) : null}
              <div className="jd-field">
                <label htmlFor="jd-ck-key">Secret key</label>
                <input
                  id="jd-ck-key"
                  className="jd-input"
                  type="password"
                  value={apiKeyVal}
                  onChange={(e) => setApiKeyVal(e.target.value)}
                  placeholder="i-paste ang API key"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="jd-btn jd-btn--primary jd-btn--block"
                onClick={saveApiKey}
                disabled={apiKeyBusy || !apiKeyVal.trim()}
              >
                {apiKeyBusy ? "Nase-save…" : (
                  <>
                    <Check size={15} /> I-save sa vault
                  </>
                )}
              </button>
            </>
          );
        })()}
      </Sheet>
    </div>
  );
}
