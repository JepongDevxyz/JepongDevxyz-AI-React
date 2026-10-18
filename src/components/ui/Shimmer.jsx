/* Shimmer — skeleton with shimmer sweep animation.
   <Shimmer lines={n} variant="chat" | "sidebar" | "settings" /> */
const LINE_WIDTHS = ["96%", "88%", "72%", "94%", "80%", "66%"];

export default function Shimmer({ lines = 3, variant = "chat" }) {
  const count = Math.max(1, Math.min(8, lines));

  if (variant === "sidebar") {
    return (
      <div className="jd-shimmer" aria-hidden="true" data-variant="sidebar">
        {Array.from({ length: count }).map((_, i) => (
          <div className="jd-shimmer__row" key={i}>
            <div className="jd-shimmer-block" style={{ width: "100%", height: 40 }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "settings") {
    return (
      <div className="jd-shimmer" aria-hidden="true" data-variant="settings">
        {Array.from({ length: count }).map((_, i) => (
          <div
            className="jd-shimmer__row"
            key={i}
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <div
              className="jd-shimmer-block"
              style={{ width: "60%", height: 14 }}
            />
            <div
              className="jd-shimmer-block"
              style={{ width: 44, height: 24, borderRadius: 999 }}
            />
          </div>
        ))}
      </div>
    );
  }

  // chat variant (default): avatar + text lines
  return (
    <div className="jd-shimmer" aria-hidden="true" data-variant="chat">
      {Array.from({ length: count }).map((_, i) => (
        <div className="jd-shimmer__row" key={i}>
          <div className="jd-shimmer-block jd-shimmer__avatar" />
          <div className="jd-shimmer__lines">
            <div
              className="jd-shimmer-block jd-shimmer__line"
              style={{ width: LINE_WIDTHS[i % LINE_WIDTHS.length] }}
            />
            <div
              className="jd-shimmer-block jd-shimmer__line"
              style={{ width: LINE_WIDTHS[(i + 2) % LINE_WIDTHS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
