export const BRAND_BG_HEX = "#090d16";

/**
 * Canonical NutriPulse Pro icon SVG markup (108x108 coordinate space).
 * Main emblem sits strictly inside x:24..84, y:23.5..82 (~55% of canvas)
 * so Android adaptive circle/squircle masks (62% safe zone) never clip it.
 */
export function buildBrandIconSvg({
  size = 1024,
  includeBackground = true,
  includeGlow = true
} = {}) {
  const bgLayer = includeBackground
    ? `<rect x="0" y="0" width="108" height="108" fill="${BRAND_BG_HEX}" />
       <circle cx="54" cy="54" r="38" fill="url(#npAmbientHalo)" />`
    : "";

  const glowStroke = includeGlow
    ? `<path d="M 24 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 84 59"
        fill="none" stroke="url(#npPulseGrad)" stroke-width="7.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.24" />`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 108 108">
  <defs>
    <radialGradient id="npAmbientHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.22" />
      <stop offset="52%" stop-color="#06b6d4" stop-opacity="0.09" />
      <stop offset="100%" stop-color="${BRAND_BG_HEX}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="npAppleStroke" x1="28" y1="34" x2="80" y2="82" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#22d3ee" />
    </linearGradient>
    <linearGradient id="npAppleFill" x1="32" y1="36" x2="76" y2="82" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.06" />
    </linearGradient>
    <linearGradient id="npLeafGrad" x1="53" y1="36" x2="66" y2="23" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#6ee7b7" />
    </linearGradient>
    <linearGradient id="npPulseGrad" x1="24" y1="58" x2="84" y2="58" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#22d3ee" />
    </linearGradient>
  </defs>
  ${bgLayer}
  <!-- Minimalist Apple / Nutrition Contour -->
  <path
    d="M 54 40 C 59 34.8 68.5 34.8 74 40.8 C 79.4 46.7 79.4 58.2 74.8 67.6 C 70.8 75.8 64.5 81.8 59 81.8 C 56.6 81.8 55.2 80.3 54 80.3 C 52.8 80.3 51.4 81.8 49 81.8 C 43.5 81.8 37.2 75.8 33.2 67.6 C 28.6 58.2 28.6 46.7 34 40.8 C 39.5 34.8 49 34.8 54 40 Z"
    fill="url(#npAppleFill)"
    stroke="url(#npAppleStroke)"
    stroke-width="2.9"
    stroke-linejoin="round"
  />
  <!-- Minimalist Stem -->
  <path
    d="M 54 37.5 Q 52.3 32.5 49.4 29.2"
    fill="none"
    stroke="#34d399"
    stroke-width="2.1"
    stroke-linecap="round"
  />
  <!-- Minimalist Leaf Crown -->
  <path
    d="M 54.4 36.2 C 54 29.2 58.6 23.6 66 23.6 C 65.8 30.8 61.2 36.2 54.4 36.2 Z"
    fill="url(#npLeafGrad)"
  />
  <!-- Subtle Leaf Vein -->
  <path
    d="M 56.2 34.2 Q 59.5 30.2 63.2 26.8"
    fill="none"
    stroke="${BRAND_BG_HEX}"
    stroke-width="1.15"
    stroke-linecap="round"
    opacity="0.55"
  />
  <!-- Heartbeat Pulse Glow & Core -->
  ${glowStroke}
  <path
    d="M 24 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 84 59"
    fill="none"
    stroke="url(#npPulseGrad)"
    stroke-width="3.7"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M 24.5 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 83.5 59"
    fill="none"
    stroke="#ecfeff"
    stroke-width="1.15"
    stroke-linecap="round"
    stroke-linejoin="round"
    opacity="0.82"
  />
</svg>`;
}

/**
 * Full-bleed 2732x2732 Splash Screen SVG with centered glowing emblem on #090d16.
 * Centered within the middle 34% so CENTER_CROP works seamlessly across
 * portrait phones, tablets, and landscape viewports without clipping.
 */
export function buildBrandSplashSvg({ width = 2732, height = 2732 } = {}) {
  const minDim = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const markSize = Math.round(minDim * 0.27);
  const markX = cx - markSize / 2;
  const markY = cy - markSize / 2 - Math.round(minDim * 0.025);
  const haloR = Math.round(minDim * 0.24);
  const barWidth = Math.round(minDim * 0.14);
  const barHeight = Math.max(8, Math.round(minDim * 0.0045));
  const barX = cx - barWidth / 2;
  const barY = markY + markSize + Math.round(minDim * 0.045);

  const scale = markSize / 108;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="spBgGlow" cx="50%" cy="48%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.18" />
      <stop offset="45%" stop-color="#06b6d4" stop-opacity="0.07" />
      <stop offset="100%" stop-color="${BRAND_BG_HEX}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="spAppleStroke" x1="28" y1="34" x2="80" y2="82" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#22d3ee" />
    </linearGradient>
    <linearGradient id="spAppleFill" x1="32" y1="36" x2="76" y2="82" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.06" />
    </linearGradient>
    <linearGradient id="spLeafGrad" x1="53" y1="36" x2="66" y2="23" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#6ee7b7" />
    </linearGradient>
    <linearGradient id="spPulseGrad" x1="24" y1="58" x2="84" y2="58" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#22d3ee" />
    </linearGradient>
    <linearGradient id="spBarGrad" x1="${barX}" y1="${barY}" x2="${barX + barWidth}" y2="${barY}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#22d3ee" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="${BRAND_BG_HEX}" />
  <circle cx="${cx}" cy="${cy - minDim * 0.02}" r="${haloR}" fill="url(#spBgGlow)" />
  <g transform="translate(${markX}, ${markY}) scale(${scale})">
    <path
      d="M 54 40 C 59 34.8 68.5 34.8 74 40.8 C 79.4 46.7 79.4 58.2 74.8 67.6 C 70.8 75.8 64.5 81.8 59 81.8 C 56.6 81.8 55.2 80.3 54 80.3 C 52.8 80.3 51.4 81.8 49 81.8 C 43.5 81.8 37.2 75.8 33.2 67.6 C 28.6 58.2 28.6 46.7 34 40.8 C 39.5 34.8 49 34.8 54 40 Z"
      fill="url(#spAppleFill)"
      stroke="url(#spAppleStroke)"
      stroke-width="2.9"
      stroke-linejoin="round"
    />
    <path d="M 54 37.5 Q 52.3 32.5 49.4 29.2" fill="none" stroke="#34d399" stroke-width="2.1" stroke-linecap="round" />
    <path d="M 54.4 36.2 C 54 29.2 58.6 23.6 66 23.6 C 65.8 30.8 61.2 36.2 54.4 36.2 Z" fill="url(#spLeafGrad)" />
    <path d="M 56.2 34.2 Q 59.5 30.2 63.2 26.8" fill="none" stroke="${BRAND_BG_HEX}" stroke-width="1.15" stroke-linecap="round" opacity="0.55" />
    <path d="M 24 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 84 59" fill="none" stroke="url(#spPulseGrad)" stroke-width="7.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.24" />
    <path d="M 24 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 84 59" fill="none" stroke="url(#spPulseGrad)" stroke-width="3.7" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 24.5 59 L 36.5 59 L 41.5 66 L 48.5 44 L 56 71.5 L 62.5 53 L 67 59 L 83.5 59" fill="none" stroke="#ecfeff" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" opacity="0.82" />
  </g>
  <!-- Subtle accent bar under logo -->
  <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="${barHeight / 2}" fill="#1e293b" />
  <rect x="${barX}" y="${barY}" width="${Math.round(barWidth * 0.56)}" height="${barHeight}" rx="${barHeight / 2}" fill="url(#spBarGrad)" />
</svg>`;
}

/**
 * Renders an SVG string onto an opaque #090d16 HTML Canvas and downloads it as a PNG.
 */
function renderSvgToOpaquePngDownload(svgMarkup, width, height, filename) {
  return new Promise((resolve, reject) => {
    try {
      const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error("Canvas context unavailable"));
            return;
          }
          // Guarantee 100% opaque dark navy full-bleed base with zero white pixels
          ctx.fillStyle = BRAND_BG_HEX;
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);

          canvas.toBlob(
            (pngBlob) => {
              if (!pngBlob) {
                reject(new Error("PNG generation failed"));
                return;
              }
              const dlUrl = URL.createObjectURL(pngBlob);
              const link = document.createElement("a");
              link.href = dlUrl;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(dlUrl), 1500);
              resolve(true);
            },
            "image/png",
            1.0
          );
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

export function exportBrandIconPng() {
  const svg = buildBrandIconSvg({ size: 1024, includeBackground: true, includeGlow: true });
  return renderSvgToOpaquePngDownload(svg, 1024, 1024, "icon.png");
}

export function exportBrandSplashPng() {
  const svg = buildBrandSplashSvg({ width: 2732, height: 2732 });
  return renderSvgToOpaquePngDownload(svg, 2732, 2732, "splash.png");
}
