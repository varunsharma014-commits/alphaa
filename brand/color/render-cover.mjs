// Renders a 1920x1080 article / LinkedIn newsletter cover from src/newsletter-cover.html.
//   node brand/color/render-cover.mjs --title "How dentists get recommended by AI" \
//     [--kicker "The Answer · Issue 4"] [--sub "One line"] [--note "Alphaa AI Agent"] [--tone se] --out brand/social/newsletter/2026-12-01-dentists.png
// Text only (no photos). Tone: mk (pink) ad (blue, default) ct (yellow) se (green) em (purple).
import path from "path"
import { fileURLToPath } from "url"
import { shot } from "./chrome.mjs"
const here = path.dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).join("\u0000").split(/\u0000?--/).filter(Boolean).map((s) => { const [k, ...v] = s.split("\u0000"); return [k, v.join(" ")] }))
if (!args.title || !args.out) { console.error('Usage: node brand/color/render-cover.mjs --title "..." --out file.png [--kicker ..] [--sub ..] [--note ..] [--tone mk|ad|ct|se|em]'); process.exit(2) }
const q = new URLSearchParams()
for (const k of ["title", "kicker", "sub", "note", "tone"]) if (args[k] !== undefined) q.set(k, args[k])
await shot(path.join(here, "src/newsletter-cover.html"), 1920, 1080, args.out, q.toString())
console.log("ok " + args.out)
