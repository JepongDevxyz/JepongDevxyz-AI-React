/* signupCommand.js — "signup:" chat command detector.
   Halimbawa: "signup: register me on openrouter.ai" → { goal: "register me on openrouter.ai" }
   Disjoint sa "browse:" command. Ginagamit ng SignupAgent view + Phase 4 chat wiring. */
const SIGNUP_RE = /^\s*signup:\s*(.+?)\s*$/i;

export function detectSignupCommand(text) {
  const t = String(text || "");
  // Unang linya lang ang sinusuri (huwag ma-trigger sa gitna ng mahabang mensahe)
  const firstLine = t.split("\n")[0];
  const m = SIGNUP_RE.exec(firstLine);
  if (!m) return null;
  const goal = m[1].trim();
  if (!goal) return null;
  return { goal };
}

export function extractSiteDomain(goal) {
  const m = String(goal || "").match(/([a-z0-9-]+\.)+[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : "";
}
