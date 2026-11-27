// Screenshots of the NEW dashboard for the app listings, from the dev-only /preview pages
// (sample data, never a real account). Run a local dev server first (npx next dev -p 3218), then:
//   node brand/apps/listing/color/shoot.mjs [http://localhost:3218]
// Writes brand/apps/listing/color/src/shots/<page>.png at 1440x900 CSS px, 2x pixels (briefing, research,
// social, email, tracking; ads is left out while it is early access).
// The cookie banner is dismissed (as "Reject") and placeholder words in the sample data are made
// readable ("Sample Dental (preview)" → "Example Dental"); every listing frame says "Example".
import { spawn } from "child_process"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import path from "path"
import { fileURLToPath } from "url"
import WebSocket from "ws"

const here = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.argv[2] || "http://localhost:3218"
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const PAGES = ["briefing", "research", "social", "email", "tracking"]
const TEXT = [
  ["Sample Dental (preview)", "Example Dental"],
  ["Sample question about a dentist near me?", "Who’s a good family dentist near me?"],
  ["Sample Rival", "Rival"], ["Sample Page", "Example Dental"], ["Sample Person", "Dr. Example"],
  ["Sample draft post", "New patients welcome"], ["Sample caption for a draft.", "Book a check-up online in two minutes."],
  ["Sample opening line of the post, quoted", "What to expect at your first visit"],
  ["Sample post 2: a walk-through of a first visit", "A walk-through of a first visit"],
  ["Sample page title for your site", "Family dentist FAQ"], ["sample query", "family dentist near me"], ["#sampletag", "#dentist"],
  ["SAMPLE SUBJECT", "WHAT’S NEW THIS MONTH"], ["Sample subject", "What’s new this month"], ["Sample note.", "Here’s what’s new at the practice this month: evening appointments on Thursdays, and a reminder to book your check-up."],
  ["Sample: connected.", "Connected."], ["Instagram: Sample · LinkedIn: Sample", "Instagram: Example Dental · LinkedIn: Dr. Example"],
]

const port = 9300 + Math.floor(Math.random() * 500)
const prof = mkdtempSync(path.join(tmpdir(), "alphaa-shoot-"))
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore", detached: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let target
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200)
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page") } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.on("open", r))
let id = 0
const pending = new Map()
ws.on("message", (m) => { const d = JSON.parse(m); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })

await send("Page.enable")
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("alphaa.consent","denied")}catch(e){}` })
const fix = `(() => { const T = ${JSON.stringify(TEXT)};
  const walk = (doc) => { if (!doc || !doc.body) return; const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { let v = n.nodeValue; for (const [a, b] of T) v = v.split(a).join(b); if (v !== n.nodeValue) n.nodeValue = v } }
  walk(document); document.querySelectorAll("iframe").forEach((f) => { if (f.srcdoc) { let v = f.srcdoc; for (const [a, b] of T) v = v.split(a).join(b); if (v !== f.srcdoc) f.srcdoc = v } })
  document.querySelectorAll("nextjs-portal").forEach((e) => e.remove())
  document.querySelectorAll("[role=dialog],[class*=consent],[class*=Consent]").forEach((e) => { if (/cookies/i.test(e.textContent || "")) e.remove() }) })()`
for (const p of PAGES) {
  await send("Page.navigate", { url: `${BASE}/preview?ws=${p}` })
  await sleep(6000)
  await send("Runtime.evaluate", { expression: fix })
  await sleep(1200)
  const { result } = await send("Page.captureScreenshot", { format: "png" })
  writeFileSync(path.join(here, "src/shots", `${p}.png`), Buffer.from(result.data, "base64"))
  console.log("shot", p)
}
ws.close()
try { process.kill(-chrome.pid, "SIGKILL") } catch {}
rmSync(prof, { recursive: true, force: true })
