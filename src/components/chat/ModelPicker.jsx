/* ModelPicker.jsx — modal: 61 models grouped by 14 providers,
   FREE-ONLY filter, custom API key pages, availability gating.
   Naka-wire sa ChatContext (selected model per session). */
import { useMemo, useState } from "react";
import { ChevronDown, Check, Search, KeyRound, Lock } from "lucide-react";
import { useChat } from "../../state/ChatContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import {
  PROVIDERS,
  isProviderConfigured,
  totalModelCount,
} from "../../api/models.js";
import Modal from "../ui/Modal.jsx";

const LS_FREE_ONLY = "jai_model_free_only";

function readFreeOnly() {
  try {
    return localStorage.getItem(LS_FREE_ONLY) !== "0";
  } catch {
    return true;
  }
}

export function ModelPickerButton() {
  const { modelDisplayName } = useChat();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="jd-model-btn"
        type="button"
        onClick={() => setOpen(true)}
        title="Pumili ng model"
      >
        <span>{modelDisplayName}</span>
        <ChevronDown />
      </button>
      <ModelPickerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ModelPickerModal({ open, onClose }) {
  const { activeModel, setSessionModel } = useChat();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(readFreeOnly);
  const [providerPage, setProviderPage] = useState(null); // provider id o null (lahat)

  const toggleFreeOnly = () => {
    const next = !freeOnly;
    setFreeOnly(next);
    try {
      localStorage.setItem(LS_FREE_ONLY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const visibleProviders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROVIDERS.map((p) => {
      let models = p.models;
      if (freeOnly) models = models.filter((m) => m.free);
      if (q) {
        models = models.filter(
          (m) =>
            m.id.toLowerCase().includes(q) ||
            (m.name || "").toLowerCase().includes(q)
        );
      }
      return { ...p, models };
    }).filter((p) =>
      providerPage
        ? p.id === providerPage
        : p.models.length > 0 || !query.trim()
    );
  }, [query, freeOnly, providerPage]);

  const pick = (providerId, modelId) => {
    const configured = isProviderConfigured(providerId);
    if (!configured) {
      // Availability gating: ipaliwanag, huwag payagang piliin
      const p = PROVIDERS.find((x) => x.id === providerId);
      toast(
        `Kailangan ng API key para sa ${p?.label || providerId} — idagdag sa Credential Vault (Settings)`
      );
      return;
    }
    setSessionModel(providerId, modelId);
    onClose();
    toast("Model napalitan");
  };

  const openProviderPage = (providerId) => setProviderPage(providerId);

  return (
    <Modal open={open} onClose={onClose} title={`Models (${totalModelCount()})`} wide>
      <input
        className="jd-model-search"
        type="search"
        placeholder="Maghanap ng model…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Maghanap ng model"
      />
      <div className="jd-model-filters">
        <button
          className={`jd-mini-toggle ${freeOnly ? "jd-mini-toggle--on" : ""}`}
          type="button"
          onClick={toggleFreeOnly}
        >
          FREE-ONLY
        </button>
        {providerPage ? (
          <button
            className="jd-mini-toggle"
            type="button"
            onClick={() => setProviderPage(null)}
          >
            ← Lahat ng providers
          </button>
        ) : null}
      </div>

      <div style={{ maxHeight: "55vh", overflowY: "auto", paddingBottom: 8 }}>
        {visibleProviders.map((p) => {
          const configured = isProviderConfigured(p.id);
          return (
            <div key={p.id}>
              <div className="jd-model-prov">
                <button
                  type="button"
                  onClick={() => openProviderPage(p.id)}
                  style={{
                    background: "none",
                    border: 0,
                    color: "inherit",
                    font: "inherit",
                    cursor: "pointer",
                    padding: 0,
                    textTransform: "inherit",
                    letterSpacing: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title={`Buksan ang ${p.label} page`}
                >
                  {p.label}
                  <ChevronDown size={12} />
                </button>
                {p.freeTier ? <span className="jd-free">FREE</span> : null}
                {!configured ? (
                  <span className="jd-model-keyhint" title={p.keyHint}>
                    <Lock size={11} style={{ verticalAlign: -1 }} /> key kailangan
                  </span>
                ) : null}
              </div>

              {p.models.map((m) => {
                const selected =
                  activeModel.provider === p.id && activeModel.id === m.id;
                return (
                  <button
                    key={m.id}
                    className="jd-model-item"
                    type="button"
                    disabled={!configured}
                    onClick={() => pick(p.id, m.id)}
                  >
                    <span>
                      {m.name || m.id}
                      <div className="jd-model-item__id">{m.id}</div>
                    </span>
                    {!configured ? (
                      <span className="jd-model-keyhint">
                        <KeyRound size={12} /> {p.keyHint}
                      </span>
                    ) : null}
                    {selected ? (
                      <span className="jd-check">
                        <Check />
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {p.models.length === 0 ? (
                <div className="jd-simple-nav__empty">
                  Walang model na tumutugma sa filter.
                </div>
              ) : null}

              {/* Custom API key page ng provider */}
              {providerPage === p.id ? (
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 12,
                    margin: "8px 0",
                    fontSize: 13,
                    color: "var(--muted)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <KeyRound size={15} />
                    <strong style={{ color: "var(--text)" }}>
                      Custom API key — {p.label}
                    </strong>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    Env: <code style={{ fontSize: 12 }}>{p.keyHint}</code>
                  </div>
                  <div>
                    Idagdag ang key sa <strong>Settings → Credential Vault</strong> para
                    ma-unlock ang mga model ng provider na ito. (Vault UI = Phase 3.)
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {visibleProviders.length === 0 ? (
          <div className="jd-thought-empty">Walang nahanap na model.</div>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
        <Search size={13} color="var(--faint)" />
        <span style={{ fontSize: 11, color: "var(--faint)" }}>
          Ang availability gating ay naka-base sa Credential Vault keys (Phase 3).
        </span>
      </div>
    </Modal>
  );
}

export default ModelPickerButton;
