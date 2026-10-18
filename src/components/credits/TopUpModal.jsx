/* TopUpModal — Phase 4.
   - 3 tiers (theme-synced, NEVER yellow — var(--accent))
   - PayMongo: createTopUp(tier) → checkoutUrl + reference; QRPh display
   - Timer countdown (15 min) + status polling kada 3s
   - Success → window "jdpay:paid" (CreditsContext nagre-refresh) +
     toast "Powered by Jepong Devxyz" */
import { useEffect, useRef, useState } from "react";
import { Check, Timer, ExternalLink, QrCode, Loader2, AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal.jsx";
import { useToast } from "../../state/ToastContext.jsx";
import { TIERS, createTopUp, pollTopUpStatus } from "../../api/paymongo.js";
import "./credits.css";

const PAY_WINDOW_S = 15 * 60;
const POLL_MS = 3000;

function fmtCountdown(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TopUpModal({ open, onClose }) {
  const { toast } = useToast();
  const [tierId, setTierId] = useState("pro");
  const [phase, setPhase] = useState("pick"); // pick | waiting | success | expired | error
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [reference, setReference] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(PAY_WINDOW_S);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const tier = TIERS.find((t) => t.id === tierId) || TIERS[0];

  const stopLoops = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset kapag binuksan; itigil ang loops kapag sinara
  useEffect(() => {
    if (open) {
      setPhase("pick");
      setError("");
      setCheckoutUrl("");
      setReference("");
      setSecondsLeft(PAY_WINDOW_S);
      setStarting(false);
    } else {
      stopLoops();
    }
    return stopLoops;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const startTopUp = async () => {
    setStarting(true);
    setError("");
    try {
      const { checkoutUrl: url, reference: ref } = await createTopUp(tierId);
      setCheckoutUrl(url);
      setReference(ref);
      setPhase("waiting");
      setSecondsLeft(PAY_WINDOW_S);

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            clearInterval(pollRef.current);
            pollRef.current = null;
            setPhase("expired");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const { status } = await pollTopUpStatus(ref);
          if (status === "paid") {
            stopLoops();
            setPhase("success");
            window.dispatchEvent(new CustomEvent("jdpay:paid", { detail: { reference: ref, tier: tierId } }));
            toast("Top-up successful! Powered by Jepong Devxyz");
          } else if (status === "expired" || status === "failed") {
            stopLoops();
            setPhase("expired");
          }
        } catch {
          /* tuloy ang polling; pansamantalang network hiccup */
        }
      }, POLL_MS);
    } catch (err) {
      setError(err?.message || "Hindi nasimulan ang top-up");
      setPhase("error");
    } finally {
      setStarting(false);
    }
  };

  const retry = () => {
    setPhase("pick");
    setError("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Top-up credits" wide>
      {phase === "pick" || phase === "error" ? (
        <>
          {phase === "error" && error ? (
            <div className="jd-pay-error">
              <AlertTriangle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              {error}
            </div>
          ) : null}
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
            Piliin ang tier — babayaran via QRPh (PayMongo):
          </p>
          <div className="jd-topup-grid" role="radiogroup" aria-label="Top-up tiers">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tierId === t.id}
                className={`jd-tier${tierId === t.id ? " is-selected" : ""}`}
                onClick={() => setTierId(t.id)}
              >
                {t.popular ? <span className="jd-tier__popular">Pinakasulit</span> : null}
                <div className="jd-tier__label">{t.label}</div>
                <div className="jd-tier__price">₱{t.php}</div>
                <div className="jd-tier__credits">{t.credits.toLocaleString()} credits</div>
                <div className="jd-tier__tagline">{t.tagline}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="jd-btn jd-btn--primary jd-btn--block"
            onClick={startTopUp}
            disabled={starting}
          >
            {starting ? (
              <>
                <Loader2 size={15} className="jd-spin" /> Naghahanda…
              </>
            ) : (
              <>Magbayad ng ₱{tier.php} via QRPh</>
            )}
          </button>
          {phase === "error" ? (
            <button type="button" className="jd-btn jd-btn--block" onClick={retry} style={{ marginTop: 8 }}>
              Subukan ulit
            </button>
          ) : null}
          <p className="jd-pay-note">QRPh top-ups: non-refundable (tingnan ang Refund Policy).</p>
        </>
      ) : null}

      {phase === "waiting" ? (
        <div className="jd-pay-status">
          <div className="jd-pay-timer">
            <Timer size={15} /> {fmtCountdown(secondsLeft)}
          </div>
          <div className="jd-pay-status__qr">
            <QrCode size={34} />
            <span>I-scan ang QRPh code sa PayMongo checkout page</span>
          </div>
          <a
            className="jd-btn jd-btn--primary jd-btn--block"
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={15} /> Buksan ang checkout page
          </a>
          <div className="jd-pay-status__ref">Ref: {reference}</div>
          <p className="jd-pay-note">
            Hinihintay ang bayad… awtomatikong magre-refresh ang balance kapag na-confirm.
            Huwag isara ang modal na ito.
          </p>
        </div>
      ) : null}

      {phase === "success" ? (
        <div className="jd-pay-success">
          <span className="jd-pay-success__icon">
            <Check size={28} />
          </span>
          <h3 style={{ margin: 0 }}>Bayad na!</h3>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            {tier.credits.toLocaleString()} credits ang naidagdag sa balance mo.
          </p>
          <button type="button" className="jd-btn jd-btn--primary" onClick={onClose} style={{ marginTop: 8 }}>
            Tapos
          </button>
        </div>
      ) : null}

      {phase === "expired" ? (
        <div className="jd-pay-status">
          <div className="jd-pay-error">
            <AlertTriangle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
            Nag-expire ang payment window. Walang na-charge.
          </div>
          <button type="button" className="jd-btn jd-btn--primary jd-btn--block" onClick={retry}>
            Gumawa ng bagong top-up
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
