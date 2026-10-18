/* Onboarding — legal consent screen. Naka-block ang app hanggang
   mag-Agree. Persist sa localStorage. LottieView (2 animations) + JD branding. */
import { useState } from "react";
import LottieView, { LOTTIE_TOP, LOTTIE_BOTTOM } from "./ui/LottieView.jsx";

export default function Onboarding({ onAccept }) {
  const [showDisagreeNote, setShowDisagreeNote] = useState(false);

  return (
    <div className="ob-wrap">
      <div className="ob-card" role="dialog" aria-modal="true" aria-label="Terms and Privacy">
        {/* Lottie top animation (220×60) — left intact */}
        <LottieView src={LOTTIE_TOP} className="ob-lottie-top" />

        <div>
          <div className="ob-brand">
            JepongDevxyz <em>AI</em>
          </div>
          <p className="ob-tagline">Maligayang pagdating, Jepong!</p>
        </div>

        <div className="ob-legal">
          <h3>Terms of Service</h3>
          <p>
            Sa paggamit ng JepongDevxyz AI, sumasang-ayon kang gamitin ito nang
            responsable: bawal ang ilegal, mapanirang, o mapang-abusong gamit.
            Ang mga sagot ng AI ay maaaring magkamali — i-verify ang mahahalagang
            impormasyon.
          </p>
          <h3>Privacy Policy</h3>
          <p>
            Ang iyong mga chat ay naka-store nang lokal sa iyong device maliban
            kung mag-sign in ka. Hindi namin ibinibenta ang iyong data. Maaari
            mong burahin ang iyong history anumang oras sa Settings.
          </p>
          <p>
            Sa pagpindot ng "Sumasang-ayon", kinukumpirma mong nabasa at
            naintindihan mo ang Terms of Service at Privacy Policy.
          </p>
        </div>

        {showDisagreeNote && (
          <p className="ob-disagree-note">
            Kailangan ang iyong pag-sang-ayon para magpatuloy at magamit ang app.
          </p>
        )}

        <div className="ob-actions">
          <button
            type="button"
            className="jd-ghost-btn"
            onClick={() => setShowDisagreeNote(true)}
          >
            Hindi sumasang-ayon
          </button>
          <button type="button" className="jd-pill-btn" onClick={onAccept}>
            Sumasang-ayon
          </button>
        </div>

        {/* Lottie bottom animation (16:9, max-width 260px) — left intact */}
        <LottieView src={LOTTIE_BOTTOM} className="ob-lottie-bottom" />

        <p className="ob-note">Powered by Jepong Devxyz</p>
      </div>
    </div>
  );
}
