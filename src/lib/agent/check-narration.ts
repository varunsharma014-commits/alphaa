// Client-safe: turns check results into chat blocks. Shared by server-built
// threads (cached results) and the client when a check runs live.
import type { Block, Chip, Message, SiteOp } from "@/lib/agent/types"
import { agent } from "@/lib/agent/types"
import type { SecurityCheck } from "@/lib/checks/security"
import type { ProfilesResult, ListingsResult, BingResult } from "@/lib/checks/run"
import type { QuestionScan } from "@/lib/questions"

const NET: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", yelp: "Yelp", youtube: "YouTube", tiktok: "TikTok", x: "X", nextdoor: "Nextdoor", google: "Google" }
const ENGINE: Record<string, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", perplexity: "Perplexity" }

/** Who makes a website change happen, when the thread is built on the server. */
export function changeChips(op: SiteOp, wpConnected: boolean, extra: Record<string, string | undefined> = {}): Chip[] {
  const handoff: Chip = { label: "Email it to my web person", action: { type: "handoff", what: op, ...extra } }
  if (wpConnected) return [{ label: "Do it on my site", action: { type: "wp-push", op, ...extra }, primary: true }, handoff]
  return [{ ...handoff, primary: true }, { label: "Have our team do it", action: { type: "link", href: "/dashboard/concierge" } }, { label: "Connect my website", action: { type: "wp-connect" } }]
}

export function securityMessages(c: SecurityCheck, wpConnected: boolean): Message[] {
  const bad = c.items.filter((i) => i.ok === false)
  const order = { high: 0, medium: 1, low: 2 }
  bad.sort((a, b) => order[a.severity] - order[b.severity])
  const out: Message[] = [
    agent([
      { kind: "text", text: bad.length ? `Security: ${c.passed} of ${c.total} checks pass.` : `Security: all ${c.total} checks pass.`, big: true },
      { kind: "sources", title: "Is your site safe to recommend?", collapseOk: true, items: c.items.map((i) => ({ name: i.label, detail: i.detail, status: i.ok === true ? "Yes" : i.ok === false ? "No" : "Couldn’t check", ok: i.ok === true })) },
    ], "sec-sum"),
  ]
  const fixableByPlugin = bad.some((i) => i.key === "hsts" || i.key === "headers")
  if (fixableByPlugin) {
    out.push(agent([
      { kind: "text", text: "Browsers and AI crawlers trust sites that send a few standard security instructions. Yours doesn’t yet — it’s a small server setting." },
      { kind: "chips", items: changeChips("headers", wpConnected) },
    ], "sec-headers"))
  }
  const serious = bad.filter((i) => i.severity === "high" && i.key !== "hsts" && i.key !== "headers")
  if (serious.length) {
    out.push(agent([
      { kind: "text", text: `This one needs your web person today: ${serious.map((i) => i.detail).join("; ")}.` },
      { kind: "chips", items: [{ label: "Email my web person", action: { type: "handoff", what: "headers" }, primary: true }] },
    ], "sec-serious"))
  }
  return out
}

export function profileMessages(r: ProfilesResult): Message[] {
  const readable = r.findings.filter((f) => f.readable)
  const blocked = r.findings.filter((f) => !f.readable)
  const issues = readable.flatMap((f) => f.issues.map((i) => ({ f, i })))
  const blocks: Block[] = [
    { kind: "text", text: r.findings.length ? `I found ${r.findings.length} of your profiles${issues.length ? ` — ${issues.length} ${issues.length === 1 ? "thing needs" : "things need"} fixing.` : "."}` : "I couldn’t find any social or review profiles linked from your site.", big: true },
  ]
  if (r.findings.length) {
    blocks.push({ kind: "sources", title: "Your profiles", items: r.findings.map((f) => ({
      name: NET[f.network] ?? f.network,
      detail: f.readable ? (f.issues[0] ?? (f.bio ? f.bio.slice(0, 90) : "Looks consistent")) : "Couldn’t read it this time — I’ll retry on my next pass",
      status: !f.readable ? "Retrying" : f.issues.length ? "Fix" : "Good",
      ok: f.readable && f.issues.length === 0,
      href: f.url,
    })) })
  }
  if (issues.length) blocks.push({ kind: "text", text: "AI compares these with your website. Fix each one marked Fix — same name, same phone, and a link back to your site." })
  if (r.missing.length) blocks.push({ kind: "text", text: `Missing: ${r.missing.map((n) => NET[n]).join(", ")}. These are the ones AI checks most for a business like yours.` })
  blocks.push({ kind: "chips", items: [{ label: "Add a profile I have", action: { type: "profile-add" } }] })
  return [agent(blocks, "prof-sum")]
}

export function listingsMessages(r: ListingsResult): Message[] {
  const out: Message[] = []
  if (r.nap.length) {
    out.push(agent([
      { kind: "text", text: r.summary.mismatched ? `${r.summary.mismatched} ${r.summary.mismatched === 1 ? "listing shows" : "listings show"} different details from yours.` : r.summary.checked ? `Your details match on every listing I could read (${r.summary.checked}).` : "I couldn’t read your directory listings this time.", big: true },
      { kind: "text", text: "AI cross-checks your name, phone and address across the web. When they disagree, it gets less sure about recommending you." },
      { kind: "sources", title: "Your details across the web", collapseOk: true, items: r.nap.map((n) => ({
        name: n.domain, detail: n.issue ?? (n.phoneOnPage ? `Shows ${n.phoneOnPage}` : "Matches"),
        status: !n.readable ? "Couldn’t read" : n.issue ? "Fix" : "Matches", ok: n.readable && !n.issue, href: n.url,
      })) },
      ...(r.summary.mismatched ? [{ kind: "text", text: "Open each one marked Fix and update it — most let you claim or edit the listing for free." } as Block] : []),
    ], "nap-sum"))
  }
  const rated = r.reviews.filter((v) => v.readable && v.rating !== null)
  if (r.reviews.length) {
    out.push(agent([
      { kind: "text", text: rated.length ? `Your ratings beyond Google: ${rated.map((v) => `${v.site} ${v.rating!.toFixed(1)}★${v.count ? ` (${v.count})` : ""}`).join(" · ")}.` : "Your reviews beyond Google:" },
      { kind: "sources", items: r.reviews.map((v) => ({ name: v.site, detail: v.readable ? (v.rating !== null ? `${v.rating.toFixed(1)} stars${v.count ? ` from ${v.count} reviews` : ""}` : "Couldn’t read the rating this time") : "Couldn’t read this page this time", status: v.readable ? (v.rating !== null ? (v.rating < 4 ? "Below 4★" : "Read") : "Rating hidden") : "Retrying weekly", ok: v.readable && (v.rating ?? 0) >= 4, href: v.url })) },
      { kind: "text", text: "AI reads these too. Asking happy customers to review you on the site where you’re weakest lifts the average fastest." },
    ], "rev-out"))
  }
  return out
}

export function bingMessages(r: BingResult): Message[] {
  if ("error" in r) return [agent([{ kind: "text", text: `I couldn’t read your Bing data: ${r.error}` }], "bing-err")]
  const trend = (a: number, b: number) => (b ? (a > b ? ` (up from ${b})` : a < b ? ` (down from ${b})` : "") : "")
  return [agent([
    { kind: "text", text: `On Bing — which ChatGPT’s search draws on — you got ${r.clicks7} clicks${trend(r.clicks7, r.clicksPrev7)} from ${r.impressions7} appearances this week.`, big: true },
    ...(r.topQueries.length ? [{ kind: "sources", title: "What people searched on Bing", items: r.topQueries.slice(0, 6).map((q) => ({ name: q.query, detail: `${q.impressions} appearances`, status: `${q.clicks} clicks`, ok: q.clicks > 0 })) } as Block] : []),
    ...((r.crawlErrors ?? 0) > 0 || (r.blockedByRobots ?? 0) > 0 ? [{ kind: "text", text: `Bing hit ${r.crawlErrors ?? 0} errors and ${r.blockedByRobots ?? 0} blocked pages crawling your site — worth a look by your web person.` } as Block] : []),
  ], "bing-sum")]
}

export function answersMessages(q: QuestionScan, at: Date): Message[] {
  const when = at.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const out: Message[] = []
  if (q.facts.issues.length) {
    const high = q.facts.issues.filter((i) => i.severity === "high")
    out.push(agent([
      { kind: "text", text: high.length ? `${ENGINE[high[0].engine]} is telling customers something wrong about you.` : "Some AI answers get a detail about you wrong.", big: true },
      { kind: "receipt", title: "What the AIs say vs. the truth", sub: `checked ${when}`, items: q.facts.issues.map((i) => `${ENGINE[i.engine]}: “${i.claim}” — actually ${i.truth}`) },
      { kind: "text", text: "AIs repeat what they find on your website, Google profile and directories. Fixing it there is what changes the answer — I check again every week." },
      { kind: "chips", items: [{ label: "Check my listings", action: { type: "link", href: "/dashboard/t/listings" }, primary: true }, { label: "Check my site", action: { type: "link", href: "/dashboard/t/site" } }] },
    ], "ans-facts"))
  }
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
  const PLATFORM = /^(chatgpt|openai|gemini|google( ai| ai overviews| business profile| my business| maps| search)?|claude|anthropic|perplexity( ai)?|copilot|microsoft copilot|bing|yelp|reddit|facebook|instagram|linkedin|youtube|tiktok|nextdoor|quora)$/i
  const real = (n: string) => !PLATFORM.test(n.trim())
  q = { ...q, rivals: q.rivals.filter((r) => real(r.name)) }
  const rows = q.questions.map((x) => {
    const es = Object.entries(x.engines).filter(([, e]) => e && e.status !== "error")
    const namedBy = es.filter(([, e]) => e!.appeared).map(([k]) => ENGINE[k])
    const others = Array.from(new Set(es.flatMap(([, e]) => e!.named))).filter(real)
    return { q: cap(x.q), n: namedBy.length, of: es.length, namedBy, others }
  })
  const rivals = q.rivals.slice(0, 3).map((r) => r.name)
  const headline = q.named === 0
    ? `None of the four AIs named you for any of your ${q.questions.length} customer questions yet.`
    : `The AIs named you in ${q.named} of ${q.answers} answers across your ${q.questions.length} customer questions.`
  const who = rivals.length
    ? `The names that keep coming up instead: ${rivals.join(", ")}${q.rivals[0] ? ` — ${q.rivals[0].name} in ${q.rivals[0].count} answers` : ""}.`
    : "When they don’t name you, they mostly don’t name anyone specific — which means the answer is still up for grabs."
  // Where you're closest: a question nobody owns yet, else the one with the fewest rivals.
  const target = [...rows].filter((r) => r.n === 0).sort((a, b) => a.others.length - b.others.length)[0]
  out.push(agent([
    { kind: "text", text: headline, big: true },
    { kind: "text", text: `${who} I asked ${when}, the way a customer would.` },
    ...(rows.filter((r) => r.n > 0).length ? [{ kind: "text", text: `Where you’re already named: ${rows.filter((r) => r.n > 0).map((r) => `“${r.q}” (${r.namedBy.join(", ")})`).join("; ")}.` } as Block] : []),
  ], "ans-sum"))
  if (target) {
    out.push(agent([
      { kind: "text", text: target.others.length ? `Here’s where I’d start: “${target.q}” Right now the AIs send people to ${target.others.slice(0, 2).join(" and ")}.` : `Here’s where I’d start: “${target.q}” Nobody owns that answer yet — it’s the easiest one to win.` },
      { kind: "text", text: "I’ll write a post that answers it directly, from your own facts — the kind of page AI quotes. You read it before anything goes live." },
      { kind: "chips", items: [{ label: "Write it", action: { type: "draft", topic: target.q, mode: "post" }, primary: true }, { label: "Change the questions", action: { type: "questions-edit" } }] },
    ], "ans-next"))
  }
  out.push(agent([
    { kind: "sources", title: "Question by question", limit: 3, items: rows.map((r) => ({
      name: r.q,
      detail: r.n ? `Named by ${r.namedBy.join(", ")}` : r.others.length ? `Named instead: ${r.others.slice(0, 2).join(", ")}` : "Nobody named yet",
      status: `${r.n} of ${r.of}`, ok: r.n > 0,
    })) },
  ], "ans-table"))
  return out
}
