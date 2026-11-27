// Webflow Marketplace promo video (1-2 min, YouTube) for the Alphaa listing. Colour system.
//   node brand/apps/listing/color/webflow/video/make-video.mjs
// Writes ../alphaa-webflow-listing.mp4 (1920x1080, 30fps, H.264, silent) + ../alphaa-webflow-listing-poster.png.
//
// What's on screen:
//  - Real product UI: the dashboard shots in ../../src/shots/ (taken by ../../shoot.mjs from the dev-only
//    /preview pages, sample data "Example Dental", never a real account).
//  - The Webflow steps (permissions, approve, published, undo, page titles, connection) are drawn in the
//    app's own style with the app's own wording (DashboardAgent / check-narration / settings/website),
//    sample data only, labelled EXAMPLE DATA. Webflow's own screens are NOT recreated (the reviewer demo
//    video is a real screen recording; see docs/webflow-marketplace-submission.md).
// Rules: no people, no voice, no stock or AI media, no music, today's truth only (no invented numbers).
import path from "path"
import { writeFile, mkdir, rm } from "fs/promises"
import { execFileSync } from "child_process"
import { fileURLToPath } from "url"
import { shot } from "../../../../../color/chrome.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const P = (...f) => path.join(here, ...f)
const CSS = `file://${path.resolve(here, "../../../../../social/base-color.css")}`
const FRAME = `file://${path.resolve(here, "../../src/frame.css")}`
const SHOTS = path.resolve(here, "../../src/shots")
const OUT = path.resolve(here, "../alphaa-webflow-listing.mp4")
const POSTER = path.resolve(here, "../alphaa-webflow-listing-poster.png")
const W = 1920, H = 1080, FPS = 30, FADE = 0.6

const LOCK = `<div class=lock><span class=orb></span>alphaa</div>`
const SITE = "example-dental.webflow.io"
const POST = "What to expect at your first visit"
const SLUG = "what-to-expect-at-your-first-visit"

const left = (s) => `<div class=l>${LOCK}${s.tag ? `<div class="tag pill ${s.tone}">${s.tag}</div>` : ""}<h1>${s.h}</h1>${s.sub ? `<p class=sub>${s.sub}</p>` : ""}</div>`
const win = (inner, url, wide = false) => `<div class="win${wide ? " wide" : ""}"><div class=bar><i></i><i></i><i></i><span>${url}</span></div><div class=body>${inner}</div><span class=exl>EXAMPLE DATA</span></div>`
const shotWin = (name) => `<div class="win shotw"><div class=bar><i></i><i></i><i></i><span>alphaa.app/dashboard</span></div><div class=vp><img src="file://${SHOTS}/${name}.png"></div><span class=exl>EXAMPLE DATA</span></div>`

// The ⌘K chat panel, in the app's style.
const you = (t) => `<div class=you>${t}</div>`
const agent = (...b) => `<div class=ag><span class="orb av"></span><div class=agb>${b.join("")}</div></div>`
const big = (t) => `<p class=big>${t}</p>`
const txt = (t) => `<p class=tx>${t}</p>`
const doc = (title, meta, body) => `<div class=doc><div class=dt>${title}</div><div class=dm>${meta}</div>${body ? `<div class=db>${body}</div>` : ""}</div>`
const chips = (...c) => `<div class=chips>${c.map(([l, p]) => `<span class="chip${p ? " p" : ""}">${l}</span>`).join("")}</div>`
const chat = (...m) => `<div class=chat><div class=ch-h><span class="orb sm"></span>Alphaa<small>Posts &amp; pages</small></div>${m.join("")}</div>`

const DRAFT_BODY = `<p>Your first visit takes about an hour. Here is what happens, step by step, so you know what to expect before you arrive.</p><h4>Before you arrive</h4><p>Fill in the health form online, bring your insurance card and a list of any medicines you take.</p><h4>At the visit</h4><p>A check-up, a cleaning and, if you need them, X-rays. We talk you through anything we find before we do it.</p>`

const PLANS = `<div class=plans>
<div class=plan><h3>Starter</h3><div class=pr>$99<small>/month</small></div><span class="badge pill se">AI search</span><ul><li>Weekly checks on ChatGPT, Gemini, Claude and Perplexity</li><li>Wrong facts corrected, website fixes</li><li>2 blog posts a month</li></ul></div>
<div class="plan rec"><h3>Pro</h3><div class=pr>$499<small>/month</small></div><span class="badge pill em">Everything except ads</span><ul><li>Starter, plus social media posts</li><li>Google Business posts and review replies</li><li>Email to your customers</li><li>4 blog posts a month</li></ul></div>
<div class=plan><h3>Growth</h3><div class=pr>$799<small>/month</small></div><span class="badge pill ad">Early access</span><ul><li>Pro, plus Google or Meta ads</li><li>Within the monthly limit you set</li></ul></div></div>`

const SCENES = [
  { id: "01-title", d: 6, title: true },
  { id: "02-ai", d: 9, tone: "se", tag: "SEO &amp; AI search", h: "See what AI tells <span>your customers</span>", sub: "Every week Alphaa asks ChatGPT, Gemini, Claude and Perplexity what your customers ask, and shows who they name.", right: shotWin("briefing") },
  { id: "03-ideas", d: 8, tone: "ct", tag: "Content", h: "Pages that answer <span>those questions</span>", sub: "Ideas from real searches and what’s working in your niche, each with its source.", right: shotWin("research") },
  { id: "04-connect", d: 9, tone: "ad", tag: "Connect once", h: "Connect Webflow <span>in one step</span>", sub: "Install from the Webflow Marketplace, pick your site, approve. Alphaa finds your blog collection and its required fields.",
    right: win(`<div class=perm><div class=ph>What Alphaa asks Webflow for</div>
      <div class=pr2><b>Sites</b><em>read</em><span>Find your site and its address</span></div>
      <div class=pr2><b>CMS</b><em>read &amp; write</em><span>Add approved posts to your blog collection, and unpublish them on Undo</span></div>
      <div class=pr2><b>Pages</b><em>read &amp; write</em><span>Save page titles and descriptions you approve</span></div>
      <div class=pf>No custom code is added to your site. Disconnect any time.</div></div>`, "alphaa.app/integrations/webflow") },
  { id: "05-approve", d: 9, tone: "em", tag: "You approve", h: "Nothing goes live <span>until you say so</span>", sub: "Read it, edit it, then publish. On Pro, Autopilot can publish posts with no missing facts for you, each with its Undo.",
    right: win(chat(agent(txt("A page that answers a question your customers ask AI. Ready when you are."), doc(POST, "draft · answers “Who’s a good family dentist near me?”", DRAFT_BODY), chips(["Do it on my site", true], ["Email it to my web person"], ["Skip"]))), "alphaa.app/dashboard") },
  { id: "06-published", d: 9, tone: "se", tag: "Published", h: "Straight into <span>your Webflow CMS</span>", sub: "A live item in your blog collection, styled by your own Collection template. Site not published yet? It waits in the CMS for your next publish.",
    right: win(chat(you("Do it on my site"), agent(big("Done — it’s live on your site."), doc("Live at", "published", `<span class=url>https://${SITE}/blog/${SLUG}</span>`), chips(["Open it"], ["Undo"]))), "alphaa.app/dashboard") },
  { id: "07-live", d: 7, tone: "ct", tag: "On your site", h: "Your design, <span>your template</span>", sub: "Alphaa only fills in the CMS item. Your Webflow site decides how it looks.",
    right: win(`<div class=site><div class=sn><b>Example Dental</b><span>Services</span><span>Blog</span><span>Book a visit</span></div><div class=sa><div class=sk>Blog</div><h2>${POST}</h2>${DRAFT_BODY}</div></div>`, `${SITE}/blog/${SLUG}`) },
  { id: "08-undo", d: 8, tone: "mk", tag: "Undo", h: "Every change <span>has Undo</span>", sub: "Undo unpublishes the item and keeps it in your CMS as a draft. Alphaa never deletes your content.",
    right: win(chat(you("Do it on my site"), agent(big("Done — it’s live on your site."), chips(["Open it"], ["Undo", true])), you("Undo"), agent(txt("Undone. It’s unpublished on your site, and kept as a draft there in case you want it back."))), "alphaa.app/dashboard") },
  { id: "09-titles", d: 8, tone: "ad", tag: "Page titles", h: "Clearer titles for <span>Google and AI</span>", sub: "Approve a new title and description and Alphaa saves it to your page settings. Undo puts the old one back.",
    right: win(`<div class=meta><div class=mh>Home page · title and description</div>
      <div class=mb><span class=lab>Before</span><b>Home</b><p>Welcome to our website.</p></div>
      <div class="mb after"><span class=lab>After</span><b>Family Dentist · Example Dental</b><p>Check-ups, cleanings and first visits for the whole family. Book online in two minutes.</p></div>
      ${chips(["Do it on my site", true], ["Skip"])}
      <p class=mn>Saved in Webflow. It’ll show on your live site the next time you hit Publish in Webflow.</p></div>`, "alphaa.app/dashboard") },
  { id: "10-control", d: 8, tone: "se", tag: "Your settings", h: "You stay <span>in control</span>", sub: "See the connected site, check it’s working, reconnect or disconnect. Disconnecting revokes Alphaa’s Webflow access.",
    right: win(`<div class=conn><div class=ch2>Website connection</div><div class=cr><span class=wf>W</span><div><b>Webflow · Example Dental <i>Connected</i></b><span>${SITE}</span></div></div>
      <p class=cw>Alphaa can publish blog posts (CMS items) and page titles and descriptions.</p>
      <div class=cb2><span class=chip>Check again</span><span class=chip>Disconnect</span></div>
      <p class=cn>Disconnect your Webflow site? Alphaa will stop publishing to it. Anything already published stays on your site.</p></div>`, "alphaa.app/dashboard/settings/website") },
  { id: "11-plans", d: 8, tone: "em", h: "Three plans, <span>month to month</span>", sub: "Billed on alphaa.app. 15% off yearly. Cancel online any time.", plans: true },
  { id: "12-end", d: 6, end: true },
]

const STYLE = `
html,body{width:${W}px;height:${H}px}
.f{--pad:110px;--gap:70px;--lw:560px;--h:70px;--s:27px;--ww:1150px;--bleed:0px}
.l .tag{font-size:22px;padding:9px 22px;margin-top:40px}.lock{font-size:34px}.lock .orb{width:42px;height:42px}
.win{width:var(--ww);border-radius:22px}.bar{height:44px}.bar span{font-size:16px}.bar i{width:13px;height:13px}
.body{min-height:600px;max-height:780px;overflow:hidden;background:#fbfbfc}
.exl{right:18px;bottom:18px;font-size:15px}
.shotw .vp{aspect-ratio:1440/900}.shotw .vp img{width:100%}
.chat{padding:34px 44px;font-size:21px}.ch-h{display:flex;align-items:center;gap:12px;font-weight:700;font-size:20px;margin-bottom:26px}.ch-h small{font-weight:500;color:var(--muted);margin-left:6px}
.orb.sm{width:26px;height:26px}.orb.av{width:34px;height:34px;margin-top:4px}
.you{margin:0 0 22px auto;width:max-content;max-width:70%;background:var(--ink);color:#fff;border-radius:20px 20px 6px 20px;padding:12px 20px;font-weight:600}
.ag{display:flex;gap:16px;margin-bottom:22px}.agb{flex:1}.big{font-size:30px;font-weight:800;letter-spacing:-.02em;margin-bottom:14px}.tx{line-height:1.45;color:var(--fg2);margin-bottom:14px}
.doc{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px 24px;box-shadow:var(--shadow);margin-bottom:16px}.dt{font-weight:800;font-size:23px}.dm{font-size:16px;color:var(--muted);margin-top:4px}
.db{margin-top:12px;font-size:17px;line-height:1.5;color:var(--fg2);max-height:250px;overflow:hidden}.db h4{font-size:18px;color:var(--ink);margin:12px 0 4px}.url{font-family:ui-monospace,Menlo,monospace;font-size:16px;color:var(--ad-ink)}
.chips{display:flex;flex-wrap:wrap;gap:10px}.chip{display:inline-block;border:1px solid var(--line2);background:#fff;border-radius:999px;padding:10px 18px;font-size:18px;font-weight:600}.chip.p{background:#0071e3;border-color:#0071e3;color:#fff}
.perm{padding:44px 50px}.ph{font-size:26px;font-weight:800;margin-bottom:26px}.pr2{display:grid;grid-template-columns:120px 170px 1fr;align-items:center;gap:18px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px 24px;margin-bottom:14px;font-size:20px}
.pr2 em{font-style:normal;font-weight:700;font-size:16px;background:var(--ad-2);color:var(--ad-ink);border-radius:999px;padding:6px 12px;width:max-content}.pr2 span{color:var(--fg2)}.pf{margin-top:24px;font-size:19px;color:var(--fg2)}
.site{background:#fff;height:100%}.sn{display:flex;gap:34px;align-items:center;padding:24px 50px;border-bottom:1px solid var(--line);font-size:18px;color:var(--fg2)}.sn b{color:var(--ink);font-size:22px;margin-right:auto}
.sa{padding:46px 120px;font-size:19px;line-height:1.6;color:var(--fg2)}.sa .sk{font-size:15px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.sa h2{font-size:44px;line-height:1.1;letter-spacing:-.03em;color:var(--ink);margin:10px 0 22px}.sa h4{color:var(--ink);font-size:21px;margin:18px 0 4px}
.meta{padding:40px 50px}.mh{font-size:24px;font-weight:800;margin-bottom:22px}.mb{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 24px;margin-bottom:14px;font-size:19px}.mb b{display:block;font-size:22px;margin:6px 0 4px}.mb p{color:var(--fg2)}
.mb.after{border:2px solid var(--se)}.lab{font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}.mn{margin-top:18px;font-size:17px;color:var(--muted)}
.conn{padding:44px 50px;font-size:20px}.ch2{font-size:26px;font-weight:800;margin-bottom:24px}.cr{display:flex;gap:18px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px 24px}
.wf{width:56px;height:56px;border-radius:14px;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:800;font-size:26px}.cr b{display:block;font-size:22px}.cr b i{font-style:normal;font-size:15px;background:var(--se-2);color:var(--se-ink);border-radius:999px;padding:4px 10px;margin-left:8px}.cr span{color:var(--muted);font-size:18px}
.cw{margin:20px 0;color:var(--fg2)}.cb2{display:flex;gap:12px}.cn{margin-top:22px;font-size:17px;color:var(--muted);background:var(--soft);border-radius:14px;padding:16px 18px}
.plans{gap:20px}.plan{padding:30px 28px}.plan h3{font-size:28px}.plan .pr{font-size:52px}.plan ul{font-size:19px}.plan .badge{font-size:15px}
.tc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--ink)}
.tc .orb{width:120px;height:120px}.tc h1{font-size:96px;letter-spacing:-.05em;font-weight:800;margin-top:34px;line-height:1}.tc h1 span{color:var(--em)}.tc p{font-size:34px;color:var(--fg2);margin-top:26px;max-width:1200px;line-height:1.35}
.tc .w{font-size:30px;font-weight:700;margin-top:40px}.tc .pills{justify-content:center;margin-top:34px}.tc .pills .pill{font-size:22px;padding:9px 20px}
`

function html(s) {
  const head = `<!doctype html><html><head><meta charset=utf-8><link rel=stylesheet href="${CSS}"><link rel=stylesheet href="${FRAME}"><style>${STYLE}</style></head>`
  if (s.title) return `${head}<body><div class="f blend"><div class=tc><span class=orb></span><h1>Alphaa <span>for Webflow</span></h1><p>Your AI marketing agent writes the pages your customers search for, and publishes them to your Webflow CMS when you approve.</p></div></div></body></html>`
  if (s.end) return `${head}<body><div class="f blend"><div class=tc><span class=orb></span><h1>alphaa</h1><p>Install from the Webflow Marketplace, or start at<br><b>alphaa.app/integrations/webflow</b></p><div class=w>Questions? hi@alphaa.app</div></div></div></body></html>`
  const right = s.plans ? PLANS : s.right
  const lw = s.plans ? "--lw:440px" : ""
  return `${head}<body class="t-${s.tone || "em"}"><div class="f" style="${lw}">${left(s)}${right}</div></body></html>`
}

await mkdir(P("html"), { recursive: true })
await mkdir(P("frames"), { recursive: true })
const pngs = []
for (const s of SCENES) {
  const src = P("html", `${s.id}.html`)
  await writeFile(src, html(s))
  const png = P("frames", `${s.id}.png`)
  await shot(src, W, H, png)
  pngs.push([png, s.d])
  console.log("frame", s.id)
}

if (process.env.FRAMES_ONLY) process.exit(0)

// Each still gets a slow push-in (zoompan on a 2x upscale keeps it smooth), then crossfades.
const args = ["-y"]
for (const [png, d] of pngs) args.push("-loop", "1", "-framerate", String(FPS), "-t", String(d), "-i", png)
const parts = []
pngs.forEach(([, d], i) => {
  const n = Math.round(d * FPS)
  parts.push(`[${i}:v]scale=${W * 2}:${H * 2},zoompan=z='1+0.035*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS},setsar=1,format=yuv420p[v${i}]`)
})
let last = "v0", t = pngs[0][1]
for (let i = 1; i < pngs.length; i++) {
  const off = (t - FADE).toFixed(2)
  parts.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${off}[x${i}]`)
  last = `x${i}`
  t = t - FADE + pngs[i][1]
}
args.push("-filter_complex", parts.join(";"), "-map", `[${last}]`, "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", String(FPS), OUT)
execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "inherit"] })
// Poster: the title frame (YouTube thumbnail size limit is 2MB; this is well under).
execFileSync("ffmpeg", ["-y", "-i", pngs[0][0], "-vf", "scale=1280:720", POSTER], { stdio: "ignore" })
await rm(P("frames"), { recursive: true, force: true })
await rm(P("html"), { recursive: true, force: true })
console.log("video", OUT, `${t.toFixed(1)}s`)
