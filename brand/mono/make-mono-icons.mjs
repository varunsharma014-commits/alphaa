// Black & white (Grok-style) Alphaa icon: white sparkle on pure black.
import sharp from "sharp"
const mark = (c, sw) => `
  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 2v4M22 4h-4" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>
  <circle cx="4" cy="20" r="2" fill="none" stroke="${c}" stroke-width="${sw}"/>`
const icon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="#000"/>
  <g transform="translate(240 240) scale(30)" fill="none">${mark("#ffffff", 1.6)}</g>
</svg>`
for (const s of [1200, 900, 512, 256]) await sharp(Buffer.from(icon(s))).png().toFile(`brand/mono/alphaa-mono-icon-${s}.png`)
console.log("ok")
