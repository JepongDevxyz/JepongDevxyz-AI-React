/* MuseMark — friendly rounded avatar mark (Jolly-like assistant aesthetic).
   Cream na bilog na mukha, simpleng mata at ngiti. Orihinal na disenyo
   para sa Muse app-style variant (hindi kopya ng ibang brand).
   Props: size (default 24), className. Pure SVG. */
export default function MuseMark({ size = 24, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Muse"
    >
      <circle cx="12" cy="12" r="11" fill="#F6F1E7" />
      <circle cx="12" cy="12" r="11" fill="none" stroke="#E4DCCB" strokeWidth="1" />
      <circle cx="8.6" cy="10.4" r="1.5" fill="#1C1E21" />
      <circle cx="15.4" cy="10.4" r="1.5" fill="#1C1E21" />
      <path
        d="M8.2 14.4 Q12 17.8 15.8 14.4"
        fill="none"
        stroke="#1C1E21"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
