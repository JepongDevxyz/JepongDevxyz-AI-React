/* LottieView — wrapper sa @lottiefiles/lottie-player web component via ref.
   Hard requirement URLs (dapat hindi mawala): */
import { useEffect, useRef } from "react";
import "@lottiefiles/lottie-player";

export const LOTTIE_TOP =
  "https://lottie.host/035962ae-ec85-4735-ac5b-3a3764108916/y2Kb1ZKXAi.json";
export const LOTTIE_BOTTOM =
  "https://lottie.host/2477a7dc-71fb-4c1b-ab00-e006ead8ebe6/Ydd9GqGGLm.json";

export default function LottieView({ src, className, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    // Set attributes imperatively — pinaka-reliable sa custom elements.
    el.setAttribute("src", src);
    el.setAttribute("background", "transparent");
    el.setAttribute("speed", "1");
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
  }, [src]);

  // NOTE: left intact — lottie-player web component (huwag tanggalin)
  return (
    <lottie-player
      ref={ref}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}
