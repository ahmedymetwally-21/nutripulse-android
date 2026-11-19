import { useId } from "react";
import { BRAND_BG_HEX } from "../utils/brandAssets";

export default function NutriPulseLogo({
  size = 48,
  showBackground = true,
  glow = true,
  className = ""
}) {
  const uid = useId().replace(/:/g, "");
  const haloId = `np-halo-${uid}`;
  const appleStrokeId = `np-as-${uid}`;
  const appleFillId = `np-af-${uid}`;
  const leafGradId = `np-lg-${uid}`;
  const pulseGradId = `np-pg-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 108 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="NutriPulse Pro"
    >
      <defs>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.24" />
          <stop offset="52%" stopColor="#06b6d4" stopOpacity="0.1" />
          <stop offset="100%" stopColor={BRAND_BG_HEX} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={appleStrokeId} x1="28" y1="34" x2="80" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={appleFillId} x1="32" y1="36" x2="76" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.17" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id={leafGradId} x1="53" y1="36" x2="66" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
        <linearGradient id={pulseGradId} x1="24" y1="58" x2="84" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {showBackground && (
        <>
          <rect x="0" y="0" width="108" height="108" fill={BRAND_BG_HEX} />
          <circle cx="54" cy="54" r="38" fill={`url(#${haloId})`} />
        </>
      )}

      {/* Minimalist Apple / Nutrition Contour */}
      <path
        d="M 54 40 C 59 34.8 68.5 34.8 74 40.8 C 79.4 46.7 79.4 58.2 74.8 67.6 C 70.8 75.8 64.5 81.8 59 81.8 C 56.6 81.8 55.2 80.3 54 80.3 C 52.8 80.3 51.4 81.8 49 81.8 C 43.5 81.8 37.2 75.8 33.2 67.6 C 28.6 58.2 28.6 46.7 34 40.8 C 39.5 34.8 49 34.8 54 40 Z"
        fill={`url(#${appleFillId})`}
        stroke={`url(#${appleStrokeId})`}
        strokeWidth="2.9"
        strokeLinejoin="round"
      />

      {/* Stem */}
      <path
        d="M 54 37.5 Q 52.3 32.5 49.4 29.2"
        stroke="#34d399"
        strokeWidth="2.1"
        strokeLinecap="round"
      />

      {/* Leaf Crown */}
      <path
        d="M 54.4 36.2 C 54 29.2 58.6 23.6 66 23.6 C 65.8 30.8 61.2 36.2 54.4 36.2 Z"
        fill={`url(#${leafGradId})`}
      />
      <path
        d="M 56.2 34.2 Q 59.5 30.2 63.2 26.8"
        stroke={BRAND_BG_HEX}
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Glowing Emerald-to-Cyan Heartbeat Pulse */}
      {glow && (
        <path
          d="M 24 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 84 59"
          stroke={`url(#${pulseGradId})`}
          strokeWidth="7.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.24"
        />
      )}
      <path
        d="M 24 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 84 59"
        stroke={`url(#${pulseGradId})`}
        strokeWidth="3.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 24.5 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 83.5 59"
        stroke="#ecfeff"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.82"
      />
    </svg>
  );
}
