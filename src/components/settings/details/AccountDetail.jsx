/* AccountDetail — profile, 6-digit OTP login (@gmail.com-only email guard),
   delete account (type-DELETE confirmation). */
import { useRef, useState } from "react";
import { Mail, Trash2, LogOut, ShieldCheck } from "lucide-react";
import { useSettings } from "../../../state/SettingsContext.jsx";
import { useToast } from "../../../state/ToastContext.jsx";

/* Maliit na tempmail blocklist (email-guard.js logic, pinaikli) */
const TEMPMAIL = [
  "tempmail", "guerrillamail", "10minutemail", "mailinator", "yopmail",
  "trashmail", "fakeinbox", "getnada", "mohmal", "dispostable", "throwaway",
];

function emailGuard(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Maling email format.";
  if (!e.endsWith("@gmail.com")) return "Gmail lang ang puwede (@gmail.com).";
  if (TEMPMAIL.some((t) => e.includes(t))) return "Temporary email ay hindi puwede.";
  return null;
}

const WIPE_KEYS = [
  "jai_settings_v1",
  "jai_sessions_v1",
  "jai_active_session_v1",
  "jai_model_v1",
  "jai_effort_v1",
  "jai_design",
  "jai_mode",
  "jai_legal_consent",
  "jai_vault_v1",
];

export default function AccountDetail() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { toast } = useToast();

  const [email, setEmail] = useState(settings.accountEmail || "");
  const [codeSent, setCodeSent] = useState(false);
  const [expected, setExpected] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [deleteText, setDeleteText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const otpRefs = useRef([]);

  const loggedIn = !!settings.accountEmail;
  const initial = ((settings.userName || settings.accountEmail || "G").trim()[0] || "G").toUpperCase();

  const sendCode = () => {
    const err = emailGuard(email);
    if (err) {
      toast(err);
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setExpected(code);
    setCodeSent(true);
    setDigits(["", "", "", "", "", ""]);
    // Walang backend sa Phase 3 — demo mode: ipakita ang code (Phase 4: tunay na email)
    toast(`Demo mode — ang code mo ay ${code} (Phase 4: via email)`);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const onDigit = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every((x) => x)) {
      const code = next.join("");
      if (code === expected) {
        updateSetting("accountEmail", email.trim().toLowerCase());
        if (!settings.userName) {
          updateSetting("userName", email.trim().split("@")[0]);
        }
        setCodeSent(false);
        setExpected("");
        toast("Naka-login ka na!");
      } else {
        toast("Maling code. Subukan ulit.");
        setDigits(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    }
  };

  const logout = () => {
    updateSetting("accountEmail", "");
    setCodeSent(false);
    setEmail("");
    toast("Naka-logout ka na");
  };

  const doDelete = () => {
    if (deleteText.trim() !== "DELETE") {
      toast('I-type ang "DELETE" para kumpirmahin');
      return;
    }
    WIPE_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });
    resetSettings();
    setDeleteText("");
    setShowDelete(false);
    toast("Nabura ang account data sa device na ito");
  };

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <h3>Profile</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span className="sb-account__avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
            {initial}
          </span>
          <div>
            <div style={{ fontWeight: 700 }}>{settings.userName || "Guest"}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {settings.accountEmail || "Hindi naka-login"}
            </div>
          </div>
        </div>
        <div className="jd-field">
          <label htmlFor="jd-name">Display name</label>
          <input
            id="jd-name"
            className="jd-input"
            value={settings.userName}
            onChange={(e) => updateSetting("userName", e.target.value.slice(0, 40))}
            placeholder="Jepong"
            maxLength={40}
          />
        </div>
      </div>

      <div className="jd-card">
        <h3>
          <Mail size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          {loggedIn ? "Naka-login" : "Mag-login"}
        </h3>
        {loggedIn ? (
          <>
            <p>Naka-login bilang {settings.accountEmail}</p>
            <button type="button" className="jd-btn" onClick={logout}>
              <LogOut size={15} /> Mag-logout
            </button>
          </>
        ) : (
          <>
            <p>6-digit code login — <strong>Gmail lang</strong> ang puwede (@gmail.com).</p>
            {!codeSent ? (
              <div className="jd-field">
                <label htmlFor="jd-email">Email</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="jd-email"
                    className="jd-input"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ikaw@gmail.com"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendCode();
                    }}
                  />
                  <button type="button" className="jd-btn jd-btn--primary" onClick={sendCode}>
                    Ipadala
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p>
                  Ipinadala ang code sa <strong>{email.trim().toLowerCase()}</strong>{" "}
                  <button
                    type="button"
                    onClick={() => setCodeSent(false)}
                    style={{ background: "none", border: 0, color: "var(--accent)", cursor: "pointer", font: "inherit", fontSize: 13 }}
                  >
                    (baguhin)
                  </button>
                </p>
                <div className="jd-otp">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      value={d}
                      inputMode="numeric"
                      maxLength={1}
                      onChange={(e) => onDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !d && i > 0) otpRefs.current[i - 1]?.focus();
                      }}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="jd-card">
        <h3 style={{ color: "#f87171" }}>
          <Trash2 size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Danger zone
        </h3>
        {!showDelete ? (
          <button type="button" className="jd-btn jd-btn--danger" onClick={() => setShowDelete(true)}>
            Burahin ang account
          </button>
        ) : (
          <>
            <p>
              <ShieldCheck size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              Buburahin ang lahat ng chats, settings, at vault sa device na ito.
              I-type ang <strong>DELETE</strong> para kumpirmahin.
            </p>
            <div className="jd-field">
              <input
                className="jd-input"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                aria-label="Type DELETE to confirm"
              />
            </div>
            <div className="jd-btnrow">
              <button type="button" className="jd-btn jd-btn--danger" onClick={doDelete}>
                Kumpirmahin ang pagbura
              </button>
              <button type="button" className="jd-btn" onClick={() => { setShowDelete(false); setDeleteText(""); }}>
                Kanselahin
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
