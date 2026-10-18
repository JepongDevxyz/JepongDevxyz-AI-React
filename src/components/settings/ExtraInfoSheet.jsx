/* ExtraInfoSheet — Phase 4 (checklist E37).
   Bawat Extra toggle ay HINDI dead: ang row ay nagbubukas ng sheet na
   nagpapaliwanag ng tunay na effect — o "coming soon" kung wala pa.
   Tunay na effect ngayon: Agent Browse (nagge-gate sa Agent Browse stack sa
   Connectors → Browse). Ang iba ay naka-save ang toggle state at may
   nakalistang planadong behavior. */
import { CheckCircle2, Clock } from "lucide-react";
import Sheet from "../ui/Sheet.jsx";

const EXTRA_INFO = {
  slopFilter: {
    title: "Slop Filter",
    what: "Anti-slop quality gate para sa mga sagot ng AI.",
    effect: null,
    soon: "Sasalain ang mga generic filler phrases bago ipakita ang sagot. Naka-save ang toggle state.",
  },
  tideline: {
    title: "Tideline Memory",
    what: "Client-side long-term memory — timeline ng mahahalagang konteksto.",
    effect: null,
    soon: "Awtomatikong magse-save ng mahahalagang facts mula sa chats, naka-encrypt sa device. Naka-save ang toggle state.",
  },
  agentBrowse: {
    title: "Agent Browse",
    what: "Browse agent (beta) — nagbubukas ng web pages sa ngalan mo via Steel pool.",
    effect:
      "AKTIBO: kapag naka-on, gumagana ang Agent Browse stack sa Settings → Connectors → Browse (magdagdag at mag-run ng browse tasks). Kapag naka-off, naka-lock ang stack.",
    soon: null,
  },
  skillStudio: {
    title: "Skill Studio",
    what: "Gumawa at mag-manage ng custom agent skills.",
    effect: null,
    soon: "Skill builder UI + /ponytail skill runtime. Naka-save ang toggle state.",
  },
  routineManager: {
    title: "Routine Manager",
    what: "Mga routine: naka-schedule na multi-step agent runs.",
    effect: null,
    soon: "Routine list, scheduler, at run history. Naka-save ang toggle state.",
  },
  specialistDots: {
    title: "Specialist Dots",
    what: "Specialist agent dots — mabilisang persona switcher.",
    effect: null,
    soon: "OpenDots trio integration. Naka-save ang toggle state.",
  },
  spaces: {
    title: "Spaces",
    what: "Spaces — hiwalay na workspaces na may sariling chats at files.",
    effect: null,
    soon: "Space switcher + per-space isolation. Naka-save ang toggle state.",
  },
  agentSkills: {
    title: "Agent Skills",
    what: "Agent Skills runtime (/ponytail) para sa chat.",
    effect: null,
    soon: "Skill invocation mula sa composer commands. Naka-save ang toggle state.",
  },
};

export function getExtraInfo(key) {
  return EXTRA_INFO[key] || null;
}

export default function ExtraInfoSheet({ infoKey, onClose }) {
  const info = getExtraInfo(infoKey);
  return (
    <Sheet open={!!info} onClose={onClose} title={info?.title || "Extra"}>
      {info ? (
        <>
          <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 12px" }}>
            {info.what}
          </p>
          {info.effect ? (
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              <CheckCircle2 size={17} style={{ color: "#22c55e", flex: "0 0 auto", marginTop: 1 }} />
              <span>{info.effect}</span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                background: "var(--accent-soft)",
                border: "1px solid var(--accent)",
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              <Clock size={17} style={{ color: "var(--accent)", flex: "0 0 auto", marginTop: 1 }} />
              <span>
                <strong>Coming soon.</strong> {info.soon}
              </span>
            </div>
          )}
        </>
      ) : null}
    </Sheet>
  );
}
