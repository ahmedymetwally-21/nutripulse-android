import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { buildBrandIconSvg, buildBrandSplashSvg, BRAND_BG_HEX } from "../src/utils/brandAssets.js";

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "assets");
const PUBLIC_DIR = path.join(ROOT, "public");
const RES_DIR = path.join(ROOT, "android", "app", "src", "main", "res");

fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

async function renderOpaquePng(svgStr, width, height, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(svgStr), { density: 300 })
    .resize(width, height, { fit: "cover", position: "center" })
    .flatten({ background: BRAND_BG_HEX })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function renderTransparentPng(svgStr, width, height, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(svgStr), { density: 300 })
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

async function main() {
  const iconFullSvg = buildBrandIconSvg({ size: 1024, includeBackground: true, includeGlow: true });
  const iconFgSvg = buildBrandIconSvg({ size: 1024, includeBackground: false, includeGlow: true });
  const iconBgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 108 108">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.14" />
      <stop offset="60%" stop-color="${BRAND_BG_HEX}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="108" height="108" fill="${BRAND_BG_HEX}" />
  <circle cx="54" cy="54" r="40" fill="url(#bgGlow)" />
</svg>`;
  const splashSquareSvg = buildBrandSplashSvg({ width: 2732, height: 2732 });

  // 1. Source assets for @capacitor/assets
  await renderOpaquePng(iconFullSvg, 1024, 1024, path.join(ASSETS_DIR, "icon-only.png"));
  await renderOpaquePng(iconFullSvg, 1024, 1024, path.join(ASSETS_DIR, "icon.png"));
  await renderOpaquePng(iconBgSvg, 1024, 1024, path.join(ASSETS_DIR, "icon-background.png"));
  await renderTransparentPng(iconFgSvg, 1024, 1024, path.join(ASSETS_DIR, "icon-foreground.png"));
  await renderOpaquePng(splashSquareSvg, 2732, 2732, path.join(ASSETS_DIR, "splash.png"));
  await renderOpaquePng(splashSquareSvg, 2732, 2732, path.join(ASSETS_DIR, "splash-dark.png"));

  // 2. Web favicon SVG
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "favicon.svg"),
    buildBrandIconSvg({ size: 128, includeBackground: true, includeGlow: true }),
    "utf8"
  );

  // 3. Android legacy mipmap PNG icons (full-bleed #090d16, zero white)
  const mipmapSizes = [
    { dir: "mipmap-ldpi", launcher: 36, adaptive: 81 },
    { dir: "mipmap-mdpi", launcher: 48, adaptive: 108 },
    { dir: "mipmap-hdpi", launcher: 72, adaptive: 162 },
    { dir: "mipmap-xhdpi", launcher: 96, adaptive: 216 },
    { dir: "mipmap-xxhdpi", launcher: 144, adaptive: 324 },
    { dir: "mipmap-xxxhdpi", launcher: 192, adaptive: 432 }
  ];

  for (const { dir, launcher, adaptive } of mipmapSizes) {
    const outDir = path.join(RES_DIR, dir);
    if (!fs.existsSync(outDir)) continue;

    await renderOpaquePng(iconFullSvg, launcher, launcher, path.join(outDir, "ic_launcher.png"));

    // Circular mask for legacy ic_launcher_round.png (still #090d16 interior, transparent corners)
    const circleMask = Buffer.from(
      `<svg width="${launcher}" height="${launcher}" viewBox="0 0 ${launcher} ${launcher}"><circle cx="${launcher / 2}" cy="${launcher / 2}" r="${launcher / 2}" fill="#ffffff" /></svg>`
    );
    const squareBuf = await sharp(Buffer.from(iconFullSvg), { density: 300 })
      .resize(launcher, launcher)
      .flatten({ background: BRAND_BG_HEX })
      .png()
      .toBuffer();
    await sharp(squareBuf)
      .ensureAlpha()
      .composite([{ input: circleMask, blend: "dest-in" }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, "ic_launcher_round.png"));

    await renderOpaquePng(iconBgSvg, adaptive, adaptive, path.join(outDir, "ic_launcher_background.png"));
    await renderTransparentPng(iconFgSvg, adaptive, adaptive, path.join(outDir, "ic_launcher_foreground.png"));
  }

  // 4. Android splash screen drawables (all densities + night variants, zero white)
  const splashTargets = [
    { dir: "drawable", w: 480, h: 800 },
    { dir: "drawable-night", w: 480, h: 800 },
    { dir: "drawable-port-ldpi", w: 240, h: 320 },
    { dir: "drawable-port-mdpi", w: 320, h: 480 },
    { dir: "drawable-port-hdpi", w: 480, h: 800 },
    { dir: "drawable-port-xhdpi", w: 720, h: 1280 },
    { dir: "drawable-port-xxhdpi", w: 960, h: 1600 },
    { dir: "drawable-port-xxxhdpi", w: 1280, h: 1920 },
    { dir: "drawable-port-night-ldpi", w: 240, h: 320 },
    { dir: "drawable-port-night-mdpi", w: 320, h: 480 },
    { dir: "drawable-port-night-hdpi", w: 480, h: 800 },
    { dir: "drawable-port-night-xhdpi", w: 720, h: 1280 },
    { dir: "drawable-port-night-xxhdpi", w: 960, h: 1600 },
    { dir: "drawable-port-night-xxxhdpi", w: 1280, h: 1920 },
    { dir: "drawable-land-ldpi", w: 320, h: 240 },
    { dir: "drawable-land-mdpi", w: 480, h: 320 },
    { dir: "drawable-land-hdpi", w: 800, h: 480 },
    { dir: "drawable-land-xhdpi", w: 1280, h: 720 },
    { dir: "drawable-land-xxhdpi", w: 1600, h: 960 },
    { dir: "drawable-land-xxxhdpi", w: 1920, h: 1280 },
    { dir: "drawable-land-night-ldpi", w: 320, h: 240 },
    { dir: "drawable-land-night-mdpi", w: 480, h: 320 },
    { dir: "drawable-land-night-hdpi", w: 800, h: 480 },
    { dir: "drawable-land-night-xhdpi", w: 1280, h: 720 },
    { dir: "drawable-land-night-xxhdpi", w: 1600, h: 960 },
    { dir: "drawable-land-night-xxxhdpi", w: 1920, h: 1280 }
  ];

  for (const { dir, w, h } of splashTargets) {
    const outDir = path.join(RES_DIR, dir);
    if (!fs.existsSync(outDir)) continue;
    const svg = buildBrandSplashSvg({ width: w, height: h });
    await renderOpaquePng(svg, w, h, path.join(outDir, "splash.png"));
  }

  console.log("Generated all full-bleed #090d16 NutriPulse Pro brand icons and splash screens.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
