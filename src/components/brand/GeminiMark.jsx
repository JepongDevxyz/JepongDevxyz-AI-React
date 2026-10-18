/* GeminiMark — carbon copy ng Gemini four-pointed sparkle.
   Exact geometry: concave quadratic curves (tunay na Gemini star shape).
   Gradient: blue #4796E3 → purple #9177C7 (diagonal, tulad ng logo).
   Props: size (default 24), className. Pure SVG. */
import { useId } from "react";

const SPARKLE_PATH =
  "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81";

export default function GeminiMark({ size = 24, className }) {
  const gid = `gemini-grad-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Gemini"
    >
      <defs>
        <linearGradient
          id={gid}
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#4796E3" />
          <stop offset="1" stopColor="#9177C7" />
        </linearGradient>
      </defs>
      <path d={SPARKLE_PATH} fill={`url(#${gid})`} />
    </svg>
  );
}
