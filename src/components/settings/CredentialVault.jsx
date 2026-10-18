/* CredentialVault — I-WIRE (hindi dead): AES-GCM encrypted vault sa localStorage.
   Entry: Settings → AI & Tools → Credential Vault.
   getCredential(service) mula api/vault.js ang ginagamit ng ModelPicker gating (Phase 2). */
import { useState } from "react";
import { ShieldCheck, KeyRound, Trash2, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { useToast } from "../../state/ToastContext.jsx";
import {
  isVaultInitialized,
  isUnlocked,
  initVault,
  unlockVault,
  lockVault,
  listCredentials,
  saveCredential,
  deleteCredential,
  maskPreview,
} from "../../api/vault.js";

export default function CredentialVault() {
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(isVaultInitialized());
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [entries, setEntries] = useState(() => (isUnlocked() ? listCredentials() : []));
  const [service, setService] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    setEntries(listCredentials());
    setUnlocked(isUnlocked());
    setInitialized(isVaultInitialized());
  };

  const doInit = async () => {
    if (pass.length < 4) {
      toast("Passphrase: hindi bababa sa 4 characters");
      return;
    }
    if (pass !== pass2) {
      toast("Hindi magkatugma ang passphrase");
      return;
    }
    setBusy(true);
    try {
      await initVault(pass);
      setPass("");
      setPass2("");
      refresh();
      toast("Nagawa ang vault — naka-unlock na");
    } catch (err) {
      toast(`Hindi nagawa: ${err?.message || "error"}`);
    } finally {
      setBusy(false);
    }
  };

  const doUnlock = async () => {
    if (!pass) return;
    setBusy(true);
    try {
      const ok = await unlockVault(pass);
      setPass("");
      if (ok) {
        refresh();
        toast("Naka-unlock ang vault");
      } else {
        toast("Maling passphrase");
      }
    } catch (err) {
      toast(`Hindi mabuksan: ${err?.message || "error"}`);
    } finally {
      setBusy(false);
    }
  };

  const doLock = () => {
    lockVault();
    setEntries([]);
    setUnlocked(false);
    toast("Naka-lock ang vault");
  };

  const doSave = async () => {
    setBusy(true);
    try {
      await saveCredential(service, secret);
      setService("");
      setSecret("");
      refresh();
      toast("Na-save sa vault (naka-encrypt)");
    } catch (err) {
      toast(`Hindi na-save: ${err?.message || "error"}`);
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (id, svc) => {
    try {
      await deleteCredential(id);
      refresh();
      toast(`Nabura ang key para sa ${svc}`);
    } catch (err) {
      toast(`Hindi nabura: ${err?.message || "error"}`);
    }
  };

  if (!initialized) {
    return (
      <div className="jd-detail">
        <div className="jd-card">
          <h3>
            <ShieldCheck size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
            Gumawa ng Credential Vault
          </h3>
          <p>
            Dito naka-encrypt (AES-GCM-256, WebCrypto) ang iyong API keys.
            Ang passphrase ay hindi naka-store — kapag nakalimutan, hindi na mabubuksan ang vault.
          </p>
          <div className="jd-field">
            <label htmlFor="jd-vpass">Vault passphrase</label>
            <input
              id="jd-vpass"
              type="password"
              className="jd-input"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Hindi bababa sa 4 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="jd-field">
            <label htmlFor="jd-vpass2">Ulitin ang passphrase</label>
            <input
              id="jd-vpass2"
              type="password"
              className="jd-input"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              placeholder="Ulitin"
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") doInit();
              }}
            />
          </div>
          <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={doInit} disabled={busy}>
            <KeyRound size={15} /> Gumawa ng vault
          </button>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="jd-detail">
        <div className="jd-card">
          <h3>
            <Lock size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
            Naka-lock ang vault
          </h3>
          <p>I-type ang passphrase para buksan. Ang key ay nasa memory lang habang bukas.</p>
          <div className="jd-field">
            <label htmlFor="jd-vunlock">Passphrase</label>
            <input
              id="jd-vunlock"
              type="password"
              className="jd-input"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Passphrase"
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") doUnlock();
              }}
            />
          </div>
          <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={doUnlock} disabled={busy}>
            <Unlock size={15} /> Buksan ang vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <h3>
          <ShieldCheck size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Naka-save na keys ({entries.length})
        </h3>
        <p>Ang ModelPicker ay nagbubukas ng provider kapag may naka-save na key dito.</p>
        {entries.length === 0 ? (
          <p>Wala pang naka-save. Magdagdag sa ibaba.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="jd-vault-entry">
              <KeyRound size={17} style={{ color: "var(--muted)" }} />
              <div className="jd-vault-entry__meta">
                <div className="jd-vault-entry__svc">{e.service}</div>
                <div className="jd-vault-entry__mask">{maskPreview(e.service)}</div>
              </div>
              <button
                type="button"
                className="jd-icon-btn"
                onClick={() => doDelete(e.id, e.service)}
                aria-label={`Delete ${e.service}`}
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="jd-card">
        <h3>Magdagdag ng key</h3>
        <div className="jd-field">
          <label htmlFor="jd-vsvc">Service / provider</label>
          <input
            id="jd-vsvc"
            className="jd-input"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="hal. openrouter, groq, mistral"
            autoComplete="off"
          />
        </div>
        <div className="jd-field">
          <label htmlFor="jd-vsecret">API key</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="jd-vsecret"
              type={showSecret ? "text" : "password"}
              className="jd-input"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="I-paste ang key"
              autoComplete="off"
            />
            <button
              type="button"
              className="jd-btn"
              onClick={() => setShowSecret((v) => !v)}
              aria-label={showSecret ? "Itago" : "Ipakita"}
            >
              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={doSave} disabled={busy}>
          <KeyRound size={15} /> I-save (naka-encrypt)
        </button>
      </div>

      <button type="button" className="jd-btn jd-btn--block" onClick={doLock}>
        <Lock size={15} /> I-lock ang vault
      </button>
    </div>
  );
}
