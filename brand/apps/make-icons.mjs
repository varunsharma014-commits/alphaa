// Renders the Alphaa app-store icons (Shopify, Webflow) from the lucide Sparkles mark.
import sharp from "sharp"
const mark = (stroke, sw) => `
  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" fill="${stroke}" fill-opacity=".14" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 2v4M22 4h-4" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>
  <circle cx="4" cy="20" r="2" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`
const icon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2997ff"/><stop offset=".55" stop-color="#0071e3"/><stop offset="1" stop-color="#3a3ad6"/></linearGradient>
    <radialGradient id="h" cx=".3" cy=".22" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#g)"/><rect width="1200" height="1200" fill="url(#h)"/>
  <g transform="translate(240 240) scale(30)" fill="none">${mark("#ffffff", 1.6)}</g>
</svg>`
for (const s of [1200, 900, 512, 256]) await sharp(Buffer.from(icon(s))).png().toFile(`brand/apps/alphaa-icon-${s}.png`)
console.log("ok")
