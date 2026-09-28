// Renders the HIMSETU app icon (lucide Snowflake on the Ice accent) to PNGs for the PWA manifest.
// Run: node scripts/make-icons.mjs
import sharp from "sharp";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Snowflake } from "lucide-react";

const glyph = renderToStaticMarkup(React.createElement(Snowflake, { size: 24, color: "#0f1216", strokeWidth: 2.25 }))
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>$/, "");

function svg(size, maskable) {
  // Maskable icons need the glyph inside the central 80% safe zone.
  const pad = maskable ? 0.22 : 0.16;
  const g = size * (1 - pad * 2);
  const radius = maskable ? 0 : size * 0.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5ab8e6"/><stop offset="1" stop-color="#2a93c9"/></linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#a)"/>
  <svg x="${size * pad}" y="${size * pad}" width="${g}" height="${g}" viewBox="0 0 24 24" fill="none" stroke="#0f1216" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
</svg>`;
}

for (const [name, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, true],
]) {
  await sharp(Buffer.from(svg(size, maskable))).png().toFile(`public/icons/${name}`);
  console.log("wrote", name);
}
