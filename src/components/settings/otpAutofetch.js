/* otpAutofetch.js — Phase 4 (checklist F44, bahagi ng SignupAgent).
   I-wire ang Gmail connector: kung may Gmail connection, ang
   `detectSignupCommand` flow ay nagfa-fetch ng OTP mula sa Gmail
   (via /api/connectors/gmail). Kung walang backend o walang connection,
   graceful fallback (nag-throw ng may code; ang UI ang magpapakita). */

import { connectorStatus, gmailLatestOtp } from "../../api/connectors.js";

function localGmailConnected() {
  try {
    const raw = localStorage.getItem("jai_connectors_v1");
    const o = raw ? JSON.parse(raw) : {};
    return o?.gmail?.connected === true;
  } catch {
    return false;
  }
}

/**
 * Kunin ang pinakabagong OTP mula sa Gmail.
 * @returns {Promise<{code: string}>}
 * @throws Error na may `code`: "NO_GMAIL" | "NO_BACKEND" | "NOT_FOUND"
 */
export async function fetchOtpFromGmail(sinceMinutes = 15) {
  // 1. May Gmail connection ba?
  let connected = localGmailConnected();
  if (!connected) {
    try {
      const st = await connectorStatus("gmail");
      connected = !!(st && st.connected);
    } catch {
      connected = false;
    }
  }
  if (!connected) {
    const e = new Error("Hindi naka-connect ang Gmail — i-connect muna sa Settings → Connectors");
    e.code = "NO_GMAIL";
    throw e;
  }
  // 2. I-fetch ang OTP (mag-throw ng NO_BACKEND kapag walang server)
  return gmailLatestOtp(sinceMinutes);
}

/** Human-friendly na mensahe para sa OTP error codes. */
export function otpErrorMessage(err) {
  switch (err?.code) {
    case "NO_GMAIL":
      return "I-connect muna ang Gmail sa Settings → Connectors para sa OTP auto-fetch.";
    case "NO_BACKEND":
      return "Walang backend — ilagay nang manu-mano ang OTP mula sa email mo.";
    case "NOT_FOUND":
      return "Walang OTP na nahanap sa Gmail sa huling 15 minuto. Hintayin ang email o ilagay manu-mano.";
    default:
      return err?.message || "Hindi na-fetch ang OTP.";
  }
}
