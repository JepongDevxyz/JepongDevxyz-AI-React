/* SignupAgent — functional UI na naka-wire sa Settings row (hindi dead toggle).
   Default OFF. `signup:` command detector: tingnan ang signupCommand.js
   (detectSignupCommand).
   OTP auto-fetch (Phase 4): naka-wire sa Gmail connector — kung naka-connect
   ang Gmail, ang pending request ay makakapag-fetch ng OTP mula sa Gmail
   (via /api/connectors/gmail); graceful fallback kapag walang backend. */
import { useState } from "react";
import { UserPlus, Check, X, FlaskConical, MailSearch } from "lucide-react";
import { useSettings } from "../../state/SettingsContext.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import Toggle from "../ui/Toggle.jsx";
import { detectSignupCommand, extractSiteDomain } from "./signupCommand.js";
import { fetchOtpFromGmail, otpErrorMessage } from "./otpAutofetch.js";

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `su-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

const STATUS_LABEL = { pending: "Pending", done: "Tapos na", blocked: "Blocked" };

export default function SignupAgent() {
  const { settings, toggleSetting } = useSettings();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [service, setService] = useState("");
  const [email, setEmail] = useState("");
  const [testCmd, setTestCmd] = useState("");
  const [fetchingOtp, setFetchingOtp] = useState(null);
  const enabled = !!settings.signupAgent;

  const startSignup = () => {
    const svc = service.trim();
    const em = email.trim().toLowerCase();
    if (!svc) {
      toast("Ilagay ang service (hal. openrouter.ai)");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast("Maling email format");
      return;
    }
    const domain = extractSiteDomain(svc) || svc;
    const req = {
      id: uid(),
      service: svc,
      email: em,
      domain,
      status: "pending",
      createdAt: Date.now(),
      steps: [
        `Natanggap ang signup request para sa ${domain}`,
        "Hakbang 1: Buksan ang signup page (nangangailangan ng browser agent — Phase 4)",
        "Hakbang 2: I-fill ang email at hintayin ang OTP (auto-fetch — Phase 4)",
      ],
    };
    setRequests((prev) => [req, ...prev]);
    setService("");
    setEmail("");
    toast("Nagawa ang signup request — tingnan ang steps sa ibaba");
  };

  const setStatus = (id, status) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast(status === "done" ? "Minarkahan bilang tapos" : "Minarkahan bilang blocked");
  };

  /* OTP auto-fetch mula sa Gmail connector (Phase 4) */
  const autoFetchOtp = async (req) => {
    setFetchingOtp(req.id);
    try {
      const { code } = await fetchOtpFromGmail(15);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                steps: [...r.steps, `Na-auto-fetch ang OTP mula sa Gmail: ${code}`],
              }
            : r
        )
      );
      toast("Na-fetch ang OTP mula sa Gmail");
    } catch (err) {
      toast(otpErrorMessage(err));
    } finally {
      setFetchingOtp(null);
    }
  };

  const detection = detectSignupCommand(testCmd);

  return (
    <div className="jd-detail">
      <div className="jd-card">
        <div className="jd-row" style={{ border: 0, padding: "4px 0 12px" }}>
          <span className="jd-row__icon"><UserPlus size={22} /></span>
          <span className="jd-row__texts">
            <span className="jd-row__label">Signup Agent <span className="jd-status" style={{ marginLeft: 6 }}>Beta</span></span>
            <span className="jd-row__sub">Auto-signup sa libreng API providers — default OFF</span>
          </span>
          <Toggle
            checked={enabled}
            onChange={() => toggleSetting("signupAgent")}
            label="Signup Agent"
          />
        </div>
        {!enabled ? (
          <p>Buksan ang toggle para magamit. Kapag naka-on, puwede kang mag-request ng signup sa kahit anong libreng API provider.</p>
        ) : (
          <p>Kapag naka-connect ang Gmail (Settings → Connectors), gumagana ang OTP auto-fetch sa bawat pending request. Ang aktwal na form-fill ay nangangailangan pa rin ng browser agent.</p>
        )}
      </div>

      {enabled ? (
        <>
          <div className="jd-card">
            <h3>Bagong signup request</h3>
            <div className="jd-field">
              <label htmlFor="jd-su-svc">Service</label>
              <input
                id="jd-su-svc"
                className="jd-input"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="hal. openrouter.ai"
                autoComplete="off"
              />
            </div>
            <div className="jd-field">
              <label htmlFor="jd-su-email">Email na gagamitin</label>
              <input
                id="jd-su-email"
                className="jd-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ikaw@gmail.com"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") startSignup();
                }}
              />
            </div>
            <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={startSignup}>
              <UserPlus size={15} /> Simulan ang signup
            </button>
          </div>

          <div className="jd-card">
            <h3>
              <FlaskConical size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
              Subukan ang <code>signup:</code> command
            </h3>
            <p>Ang chat command detector (integration point para sa Phase 4):</p>
            <div className="jd-field">
              <input
                className="jd-input"
                value={testCmd}
                onChange={(e) => setTestCmd(e.target.value)}
                placeholder='hal. signup: register me on openrouter.ai'
                aria-label="Test signup command"
              />
            </div>
            {testCmd ? (
              detection ? (
                <p style={{ color: "#22c55e" }}>
                  ✓ Na-detect! Goal: <strong>{detection.goal}</strong>
                  {extractSiteDomain(detection.goal) ? ` (domain: ${extractSiteDomain(detection.goal)})` : ""}
                </p>
              ) : (
                <p style={{ color: "#f87171" }}>✗ Hindi ito signup command — dapat nagsisimula sa "signup:"</p>
              )
            ) : null}
          </div>

          <div className="jd-card">
            <h3>Mga request ({requests.length})</h3>
            {requests.length === 0 ? (
              <p>Wala pang signup request.</p>
            ) : (
              requests.map((r) => (
                <div key={r.id} style={{ borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 14 }}>{r.service}</strong>
                    <span className={`jd-status jd-status--${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0" }}>{r.email}</div>
                  <ul className="jd-steps">
                    {r.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  {r.status === "pending" ? (
                    <div className="jd-btnrow" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="jd-btn"
                        onClick={() => autoFetchOtp(r)}
                        disabled={fetchingOtp === r.id}
                      >
                        <MailSearch size={14} />
                        {fetchingOtp === r.id ? "Nagfe-fetch…" : "I-auto-fetch ang OTP"}
                      </button>
                      <button type="button" className="jd-btn" onClick={() => setStatus(r.id, "done")}>
                        <Check size={14} /> Tapos na
                      </button>
                      <button type="button" className="jd-btn" onClick={() => setStatus(r.id, "blocked")}>
                        <X size={14} /> Blocked
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
