"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AgentFeed, Composer } from "./AgentFeed"
import { agent, mid, user as userMsg, type Block, type Chip, type Message, type SiteOp, type Task } from "@/lib/agent/types"
import { securityMessages, profileMessages, listingsMessages, bingMessages } from "@/lib/agent/check-narration"
import type { EngineKey } from "@/lib/agent/types"
import { siteCheckBlocks, describeSchemas } from "@/lib/agent/site-narration"
import { citationBlocks, discussionMessages } from "@/lib/agent/thread-blocks"
import { NONE_AVAILABLE, PLATFORM_NAME, platformPickerBlocks, type Availability } from "@/lib/connector/platforms"
import type { Platform } from "@/lib/connector/types"

type LiveResult = { engine: EngineKey; answer: string; appeared: boolean; mentioned: string[]; status: string }

type Prefs = { webPersonEmail: string | null; wpConnected: boolean; siteConnected: boolean; platform: Platform | null; available: Availability }
// What a connected Webflow / Shopify / Wix site can take through its API (WordPress takes everything).
const API_OPS: SiteOp[] = ["post", "page", "meta"]
type Pending =
  | { kind: "handoff"; what: SiteOp; title?: string; text?: string; url?: string }
  | { kind: "review" }
  | { kind: "review-link" }
  | { kind: "profile" }
  | { kind: "location" }
  | { kind: "bing" }
  | { kind: "questions" }
  | { kind: "shopify" }

const OP_NAME: Record<SiteOp, string> = { page: "the page", schema: "your structured facts", llms: "your llms.txt", robots: "the robots.txt fix", post: "the post", meta: "the new title and description", sitemap: "your sitemap", headers: "the security settings" }
const TOPIC_LINKS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/t/reviews", label: "Reviews" },
  { href: "/dashboard/t/site", label: "Site Schema & Code" },
  { href: "/dashboard/t/sources", label: "Source Tracking" },
  { href: "/dashboard/t/answers", label: "AI Answers" },
  { href: "/dashboard/t/content", label: "Posts & Pages" },
  { href: "/dashboard/t/listings", label: "Listings & Profiles" },
  { href: "/dashboard/t/competitors", label: "Competitors" },
  { href: "/dashboard/t/briefings", label: "Weekly Briefings" },
]

export function DashboardAgent({
  initial,
  businessName,
  autorun = [],
  current = "/dashboard",
  context,
}: {
  initial: Message[]
  businessName: string
  autorun?: Task[]
  current?: string
  context?: { businessType: string | null; city: string | null }
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initial)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const docEdits = useRef<Record<string, string>>({})
  const prefs = useRef<Prefs>({ webPersonEmail: null, wpConnected: false, siteConnected: false, platform: null, available: NONE_AVAILABLE })
  const pending = useRef<Record<string, Pending>>({})

  async function loadPrefs() {
    const r = await fetch("/api/agent/settings").then((x) => (x.ok ? x.json() : null)).catch(() => null)
    if (r) prefs.current = { webPersonEmail: r.webPersonEmail ?? null, wpConnected: !!r.wpConnected, siteConnected: !!r.siteConnected, platform: r.platform ?? null, available: { ...NONE_AVAILABLE, ...(r.available ?? {}) } }
  }

  // Who makes a website change happen: the agent itself when the site is
  // connected; otherwise the owner's web person (by email) or our team.
  function siteChips(op: SiteOp, extra: { title?: string; text?: string; docId?: string; url?: string; locationId?: string; draftId?: string } = {}): Chip[] {
    const handoff: Chip = { label: "Email it to my web person", action: { type: "handoff", what: op, ...extra } }
    if (prefs.current.wpConnected || (prefs.current.siteConnected && API_OPS.includes(op))) return [{ label: "Publish it to my site", action: { type: "wp-push", op, ...extra }, primary: true }, handoff]
    if (prefs.current.siteConnected) return [{ ...handoff, primary: true }, { label: "Have our team do it", action: { type: "link", href: "/dashboard/concierge" } }]
    return [
      { ...handoff, primary: true },
      { label: "Have our team do it", action: { type: "link", href: "/dashboard/concierge" } },
      { label: "Connect my website", action: { type: "wp-connect" } },
    ]
  }
  const inputRef = useRef<HTMLInputElement>(null)

  const push = useCallback((...m: Message[]) => setMessages((prev) => [...prev, ...m]), [])

  async function post<T>(url: string, body?: unknown): Promise<{ ok: boolean; data: T & { error?: string } }> {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    const data = (await res.json().catch(() => ({}))) as T & { error?: string }
    return { ok: res.ok, data }
  }

  const fail = (text: string) => push(agent([{ kind: "text", text }]))
  const replace = (id: string, m: Message) => setMessages((prev) => prev.map((x) => (x.id === id ? { ...m, id } : x)))
  const setSteps = (id: string, done: number) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, blocks: m.blocks.map((b) => (b.kind === "steps" ? { ...b, done } : b)) } : m)))

  // Jobs the agent starts on its own (or on "run" chips): never a blank
  // page with a button — the thread shows progress, then the findings.
  async function runTask(task: Task) {
    if (task === "security" || task === "profiles" || task === "listings" || task === "bing") {
      const id = `${task}-run`
      const { ok, data } = await post<{ data?: unknown }>(`/api/agent/checks?kind=${task}`)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      if (!ok || !data.data) {
        if (task !== "bing") push(agent([{ kind: "text", text: data.error ?? "That check didn’t finish this time. I’ll run it again on my next pass." }]))
        return
      }
      const d = data.data as never
      const msgs = task === "security" ? securityMessages(d, prefs.current.wpConnected) : task === "profiles" ? profileMessages(d) : task === "listings" ? listingsMessages(d) : bingMessages(d)
      push(...msgs.map((m) => ({ ...m, id: mid(m.id) })))
      return
    }
    if (task === "site-check") {
      const id = "st-run"
      let n = 0
      const t = setInterval(() => setSteps(id, Math.min(++n, 3)), 3500)
      const { ok, data } = await post<{ check?: Parameters<typeof siteCheckBlocks>[0]; userId?: string }>("/api/agent/site-check")
      clearInterval(t)
      if (!ok || !data.check) return replace(id, agent([{ kind: "text", text: data.error ?? "I couldn’t read your site just now. I’ll try again shortly." }, { kind: "chips", items: [{ label: "Try again", action: { type: "run", task: "site-check" }, primary: true }] }]))
      replace(id, agent(siteCheckBlocks(data.check)))
      const failed = new Set(data.check.checks.filter((c) => c.ok === false).map((c) => c.key as string))
      if (failed.has("aibots") || failed.has("robots")) {
        push(agent([
          { kind: "text", text: "First, the door: some AI search assistants are being turned away from your site.", big: true },
          { kind: "text", text: "I wrote robots.txt rules that let ChatGPT, Claude and Perplexity’s search crawlers in. If a firewall like Cloudflare is the blocker, your web person needs to allow them there too — I include that in the instructions." },
          { kind: "chips", items: siteChips("robots") },
        ]))
      }
      if (failed.has("meta") || failed.has("headings")) {
        push(agent([
          { kind: "text", text: failed.has("meta") ? "Your homepage title and description don’t say clearly what you do and where — that’s the first thing AI and Google read." : "Your homepage’s main heading doesn’t say what you do. I’ll start with the title and description, which I can change safely." },
          { kind: "chips", items: [{ label: "Write a better title and description", action: { type: "draft", topic: "Homepage title and description", mode: "meta" }, primary: true }] },
        ]))
      }
      if (failed.has("sitemap") && prefs.current.wpConnected) {
        push(agent([{ kind: "text", text: "You don’t have a sitemap AI crawlers can find. WordPress can make one for you." }, { kind: "chips", items: siteChips("sitemap") }]))
      }
      await runTask("schema")
      if (data.userId) {
        const llms = `${window.location.origin}/llms/${data.userId}`
        push(agent([
          { kind: "text", text: "I also keep the file AI assistants read first — your llms.txt — up to date for you." },
          { kind: "doc", title: "llms.txt · kept current by Alphaa", meta: "hosted by Alphaa", text: llms },
          { kind: "chips", items: [...siteChips("llms"), { label: "Copy the link", action: { type: "copy", text: llms, done: "Copied." } }] },
        ]))
      }
      if (!prefs.current.siteConnected) {
        push(agent([
          { kind: "text", text: "Want me to make these changes myself?" },
          { kind: "text", text: "Connect your website once — WordPress, Shopify or Webflow (Wix is coming soon). After that, every approved fix is one tap, and every change has an Undo." },
          { kind: "chips", items: [{ label: "Connect my website", action: { type: "wp-connect" }, primary: true }] },
        ]))
      }
      return
    }
    if (task === "schema") {
      let res = await fetch("/api/schema/latest").then((r) => r.json()).catch(() => ({}))
      let schemas = res?.schemaMarkup?.schemas as { type: string; jsonLd: Record<string, unknown> }[] | undefined
      if (!schemas?.length) {
        push(agent([{ kind: "text", text: "Writing the structured facts AI reads about you…" }], "schema-run"))
        const gen = await post<{ schemas?: typeof schemas }>("/api/schema/generate")
        schemas = gen.data.schemas
        setMessages((prev) => prev.filter((m) => m.id !== "schema-run"))
        if (!gen.ok || !schemas?.length) return fail(gen.data.error ?? "I couldn’t write your structured facts just now.")
        res = null
      }
      const code = schemas.map((s) => `<script type="application/ld+json">\n${JSON.stringify(s.jsonLd, null, 2)}\n</script>`).join("\n\n")
      push(agent([
        { kind: "text", text: "I wrote the structured facts AI reads about you.", big: true },
        { kind: "receipt", title: "What it tells AI", sub: `${schemas.length} ${schemas.length === 1 ? "block" : "blocks"} · ready to install`, items: describeSchemas(schemas) },
        { kind: "text", text: prefs.current.wpConnected ? "It goes in your site’s header once. Say the word and I’ll add it:" : "It goes in your site’s header once. You don’t touch it — pick who installs it:" },
        { kind: "chips", items: [...siteChips("schema"), { label: "Copy the code", action: { type: "copy", text: code, done: "Copied." } }] },
      ]))
      return
    }
    if (task === "citations") {
      const id = "src-run"
      let n = 0
      const t = setInterval(() => setSteps(id, Math.min(++n, 2)), 20000)
      const { ok, data } = await post<{ report?: Parameters<typeof citationBlocks>[0] }>("/api/citations")
      clearInterval(t)
      if (!ok || !data.report || !data.report.targets?.length) return replace(id, agent([{ kind: "text", text: data.error ?? "The search didn’t come back this time. I’ll run it again on my next pass." }, { kind: "chips", items: [{ label: "Try again now", action: { type: "run", task: "citations" }, primary: true }] }]))
      replace(id, agent(citationBlocks(data.report, context?.businessType ?? null, context?.city ?? null, new Date())))
      push(...discussionMessages(data.report))
    }
  }

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      await loadPrefs()
      for (const t of autorun) await runTask(t)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function liveCheck(question: string) {
    push(userMsg(question))
    setBusy(true)
    push(agent([{ kind: "text", text: "Asking all four now. Takes about 20 seconds." }, { kind: "steps", items: ["Asking ChatGPT", "Asking Gemini", "Asking Claude", "Asking Perplexity"], done: 4 }]))
    const { ok, data } = await post<{ results?: LiveResult[]; remaining?: number }>("/api/sandbox/ask", { question })
    setBusy(false)
    if (!ok || !data.results) return fail(data.error ?? "The AIs didn’t answer this time. Try again in a minute.")
    const results = data.results
    const answered = results.filter((r) => r.status === "appeared" || r.status === "not_appearing")
    const named = answered.filter((r) => r.appeared)
    const blocks: Block[] = [
      { kind: "verdicts", items: results.map((r) => ({ engine: r.engine, state: r.status === "appeared" ? "found" : r.status === "not_appearing" ? "missing" : "unknown" })) },
      { kind: "text", text: named.length === 0 ? `None of the ${answered.length} named you.` : `${named.length} of ${answered.length} named you${named.length ? `: ${named.map((r) => r.engine === "chatgpt" ? "ChatGPT" : r.engine[0].toUpperCase() + r.engine.slice(1)).join(", ")}` : ""}.` },
    ]
    const lead = answered.find((r) => r.engine === "chatgpt" && r.answer.trim()) ?? answered.find((r) => r.answer.trim())
    if (lead) blocks.push({ kind: "answer", engine: lead.engine, query: question, answer: lead.answer, appeared: lead.appeared, mentioned: lead.mentioned, businessName })
    const rivals = Array.from(new Set(answered.flatMap((r) => r.mentioned))).filter((n) => n.toLowerCase() !== businessName.toLowerCase()).slice(0, 4)
    if (rivals.length) blocks.push({ kind: "text", text: `Named instead: ${rivals.join(", ")}.` })
    if (typeof data.remaining === "number") blocks.push({ kind: "text", text: `${data.remaining} live checks left today. I also check on my own every week.` })
    push(agent(blocks))
  }

  async function onChip(chip: Chip, messageId: string) {
    const a = chip.action
    switch (a.type) {
      case "link":
        if (/^(sms|mailto|tel):/.test(a.href)) window.location.href = a.href
        else if (a.href.startsWith("http")) window.open(a.href, "_blank", "noopener")
        else if (a.href.startsWith("/api/")) window.location.href = a.href
        else router.push(a.href)
        return
      case "copy":
        try {
          await navigator.clipboard.writeText(a.text)
          push(agent([{ kind: "text", text: a.done ?? "Copied." }]))
        } catch {
          push(agent([{ kind: "doc", title: "Copy this", meta: "select all", text: a.text }]))
        }
        return
      case "run":
        push(agent([{ kind: "text", text: "On it." }, { kind: "steps", items: ["Working"], done: 0 }], a.task === "citations" ? "src-run" : a.task === "site-check" ? "st-run" : a.task === "schema" ? undefined : `${a.task}-run`))
        return runTask(a.task)
      case "draft": {
        push(userMsg(chip.label))
        setBusy(true)
        const { ok, data } = await post<{ title?: string; text?: string }>("/api/agent/draft", { topic: a.topic, competitor: a.competitor, mode: a.mode, url: a.url, locationId: a.locationId, kind: a.kind })
        setBusy(false)
        if (!ok || !data.text) return fail(data.error ?? "I couldn’t write that just now.")
        const docId = `draft-${Date.now()}`
        if (a.mode === "post") {
          const d = data as { title?: string; text?: string; draftId?: string; image?: string | null }
          push(agent([
            { kind: "text", text: "Here’s the post — written to be the answer AI quotes. The highlighted bits are facts only you know: tap Edit and fill them in, then pick who publishes it." },
            { kind: "doc", title: d.title ?? "New post", meta: "draft · not published", text: d.text, docId, editable: true, markdown: true, image: d.image ?? undefined },
            { kind: "chips", items: siteChips("post", { title: d.title, text: d.text, docId, draftId: d.draftId }) },
          ]))
          return
        }
        if (a.mode === "meta") {
          const d = data as { text?: string; current?: { title?: string | null; description?: string | null } }
          push(agent([
            ...(d.current?.title ? [{ kind: "text", text: `Right now it says: “${d.current.title}”${d.current.description ? ` — “${d.current.description}”` : " with no description"}.` } as Block] : []),
            { kind: "doc", title: "New title & description", meta: "tap to edit", text: d.text, docId, editable: true },
            { kind: "chips", items: siteChips("meta", { text: d.text, docId, url: a.url }) },
          ]))
          return
        }
        if (a.mode === "location") {
          push(agent([
            { kind: "text", text: "Here’s the page for that location — it tells AI exactly where you are and what you do there." },
            { kind: "doc", title: data.title ?? "Location page", meta: "draft · not published", text: data.text, docId, editable: true, markdown: true },
            { kind: "chips", items: siteChips("page", { title: data.title, text: data.text, docId, locationId: a.locationId }) },
          ]))
          return
        }
        if (a.mode === "outreach") {
          push(agent([
            { kind: "text", text: a.kind === "directory" ? "Here’s how to get on that page:" : "Here’s an email you could send the people behind that list. It comes from you — edit it, then send it from your own inbox." },
            { kind: "doc", title: a.topic.slice(0, 80), meta: "draft", text: data.text, docId, editable: true },
            { kind: "chips", items: [{ label: "Copy it", action: { type: "copy", text: data.text!, done: "Copied." }, primary: true }, ...(a.url ? [{ label: "Open the page", action: { type: "link", href: a.url } } as Chip] : [])] },
          ]))
          return
        }
        if (a.mode === "reply") {
          const where = a.url ? new URL(a.url).hostname.replace(/^www\./, "") : "the discussion"
          push(agent([
            { kind: "text", text: `Here’s a reply you could post on ${where}. It helps first and says who you are — communities (and AI) trust that. Edit anything, then post it from your own account.` },
            { kind: "doc", title: `Your reply · ${where}`, meta: "draft · you post it", text: data.text, docId, editable: true },
            { kind: "chips", items: [
              { label: "Copy it", action: { type: "copy", text: data.text, done: "Copied. Paste it in the thread — and check the community’s rules on business posts first." }, primary: true },
              ...(a.url ? [{ label: "Open the discussion", action: { type: "link", href: a.url } } as Chip] : []),
            ] },
          ]))
          return
        }
        push(agent([
          { kind: "text", text: `Here’s the section I’d add to your site — written from your facts. Anything in [brackets] is a detail only you know: tap the draft to fill it in before it goes live.` },
          { kind: "doc", title: data.title ?? a.topic, meta: "draft · not published", text: data.text, docId, editable: true },
          { kind: "chips", items: [...siteChips("page", { title: data.title ?? a.topic, text: data.text, docId }), { label: "Copy it", action: { type: "copy", text: data.text, done: "Copied." } }] },
        ]))
        return
      }
      case "connect": {
        if (!prefs.current.available[a.platform]) {
          push(userMsg(chip.label), agent([{ kind: "text", text: `Connecting ${PLATFORM_NAME[a.platform]} is coming soon. Until then, tap “Email it to my web person” on any fix and I’ll send them exactly what to change, or our team can do it for you.` }]))
          return
        }
        if (a.platform === "wordpress") return onChip({ label: chip.label, action: { type: "wp-connect", direct: true } }, messageId)
        if (a.platform === "shopify") {
          const formId = mid("shopify")
          pending.current[formId] = { kind: "shopify" }
          push(userMsg(chip.label), agent([
            { kind: "text", text: "What’s your Shopify store address? It ends in .myshopify.com — you’ll find it in Shopify under Settings → Domains." },
            { kind: "form", formId, fields: [{ name: "shop", label: "Store address", type: "text", placeholder: "yourstore.myshopify.com", required: true }], cta: "Connect Shopify", fine: "Shopify will ask you to approve access. I only get permission to publish blog posts and pages — nothing about orders or customers." },
          ]))
          return
        }
        window.location.href = `/api/connect/${a.platform}/start`
        return
      }
      case "wp-connect": {
        if (!prefs.current.wpConnected && prefs.current.siteConnected) {
          push(agent([
            { kind: "text", text: `You’re connected to your ${PLATFORM_NAME[prefs.current.platform ?? "webflow"]} site. ✓ Approved posts, pages and page titles go straight there; anything the platform doesn’t let apps change, I email to your web person.` },
            { kind: "chips", items: [{ label: "See or switch the connection", action: { type: "link", href: "/dashboard/settings/website" } }] },
          ]))
          return
        }
        if (!prefs.current.wpConnected && !a.direct) {
          push(agent(platformPickerBlocks(prefs.current.available)))
          return
        }
        setBusy(true)
        const st = await fetch("/api/connect/wp/status").then((r) => r.json()).catch(() => null) as { connected?: boolean; reachable?: boolean; siteUrl?: string; key?: string; error?: string } | null
        setBusy(false)
        if (!st || (!st.connected && !st.key)) return fail("I couldn’t check your connection just now. Try again in a minute.")
        if (st.connected && st.reachable) {
          prefs.current.wpConnected = true
          push(agent([
            { kind: "text", text: `I’m connected to ${new URL(st.siteUrl!).hostname}. ✓`, big: true },
            { kind: "text", text: "From now on, “Publish it to my site” puts a fix live straight away, and every change comes with an Undo. Want me to start with the basics?" },
            { kind: "chips", items: [
              { label: "Add my structured facts", action: { type: "wp-push", op: "schema" }, primary: true },
              { label: "Publish my llms.txt", action: { type: "wp-push", op: "llms" } },
              { label: "Let AI search bots in", action: { type: "wp-push", op: "robots" } },
            ] },
          ]))
          return
        }
        if (st.connected && !st.reachable) {
          push(agent([
            { kind: "text", text: `I can’t reach the plugin on ${st.siteUrl ? new URL(st.siteUrl).hostname : "your site"} right now.` },
            { kind: "text", text: `WordPress said: ${st.error ?? "no answer"}. A security plugin may be blocking the WordPress REST API, or the Alphaa plugin was deactivated. Check it’s active under Plugins, then try again.` },
            { kind: "chips", items: [{ label: "Check again", action: { type: "wp-connect", direct: true }, primary: true }, { label: "Email my web person instead", action: { type: "handoff", what: "schema" } }] },
          ]))
          return
        }
        push(agent([
          { kind: "text", text: "Connect your WordPress site — about two minutes, once.", big: true },
          { kind: "receipt", title: "Three steps", sub: "you need to be a WordPress admin", items: [
            "Download my plugin (a small zip file).",
            "In WordPress: Plugins → Add New → Upload Plugin → choose the zip → Install → Activate.",
            "Settings → Alphaa → paste the key below → Connect.",
          ] },
          { kind: "doc", title: "Your connection key", meta: "private — only for your site", text: st.key ?? "" },
          { kind: "chips", items: [
            { label: "Download the plugin", action: { type: "link", href: `${window.location.origin}/downloads/alphaa-connector.zip` }, primary: true },
            { label: "Copy my key", action: { type: "copy", text: st.key ?? "", done: "Key copied. Paste it in Settings → Alphaa." } },
            { label: "I’ve connected it", action: { type: "wp-connect", direct: true } },
          ] },
          { kind: "text", text: "Nothing goes live until you approve it here, pages are never deleted (Undo moves them to WordPress’s Trash), and the plugin only counts visitors who arrive from an AI assistant — no cookies, nothing personal." },
        ]))
        return
      }
      case "wp-push": {
        const text = (a.docId && docEdits.current[a.docId]) || a.text
        push(userMsg(`Publish ${OP_NAME[a.op]}`))
        setBusy(true)
        const { ok, data } = await post<{ url?: string; changeId?: string; indexed?: boolean; shadowed?: boolean; note?: string }>("/api/connect/wp/push", { op: a.op, title: a.title, text, url: a.url, locationId: a.locationId, draftId: a.draftId })
        setBusy(false)
        // Keep a way to retry: the chip above is spent, and the usual fix (filling in
        // [bracketed] facts) happens in the draft, which the retry re-reads via docEdits.
        if (!ok || !data.url) return push(agent([
          { kind: "text", text: data.error ?? "Your site didn’t accept it. Nothing changed." },
          { kind: "chips", items: [{ label: "Try publishing again", action: a, primary: true }] },
        ]))
        const blocks: Block[] = [
          // Webflow sites that were never published only take staged CMS items (see connector note).
          ...(/isn’t published yet/.test(data.note ?? "")
            ? [{ kind: "text", text: "Done — it’s saved in your site’s CMS.", big: true } as Block, { kind: "doc", title: "Goes live at", meta: "on your next site publish", text: data.url } as Block]
            : [{ kind: "text", text: "Done — it’s live on your site.", big: true } as Block, { kind: "doc", title: "Live at", meta: "published", text: data.url } as Block]),
        ]
        if (data.note) blocks.push({ kind: "text", text: data.note })
        if (data.indexed) blocks.push({ kind: "text", text: "I also told Bing it changed (IndexNow), so ChatGPT’s search can pick it up sooner." })
        if (data.shadowed) blocks.push({ kind: "text", text: `Heads-up: your server already has its own ${a.op === "llms" ? "llms.txt" : "robots.txt"} file, and that file wins over mine. Your web person needs to update or remove it — I can email them.` })
        blocks.push({ kind: "chips", items: [
          { label: "Open it", action: { type: "link", href: data.url } },
          ...(data.shadowed ? [{ label: "Email my web person", action: { type: "handoff", what: a.op } } as Chip] : []),
          { label: "Undo", action: { type: "wp-undo", changeId: data.changeId! } },
        ] })
        push(agent(blocks))
        return
      }
      case "wp-undo": {
        push(userMsg("Undo"))
        setBusy(true)
        const { ok, data } = await post("/api/connect/wp/undo", { changeId: a.changeId })
        setBusy(false)
        if (!ok) return fail(data.error ?? "I couldn’t undo it just now.")
        const onWp = !/^(webflow|shopify|wix):/.test(a.changeId)
        push(agent([{ kind: "text", text: onWp ? "Undone. Your site is back the way it was. (Pages go to WordPress’s Trash, so you can restore them there too.)" : "Undone. It’s unpublished on your site, and kept as a draft there in case you want it back." }]))
        return
      }
      case "handoff": {
        const text = (a.docId && docEdits.current[a.docId]) || a.text
        const formId = mid("handoff")
        pending.current[formId] = { kind: "handoff", what: a.what, title: a.title, text, url: a.url }
        push(userMsg(chip.label), agent([
          { kind: "text", text: `I’ll email ${OP_NAME[a.what]} to your web person with exactly where it goes and how to check it. Their replies come to you.` },
          { kind: "form", formId, fields: [{ name: "email", label: "Your web person’s email", type: "email", placeholder: "dev@example.com", value: prefs.current.webPersonEmail ?? "", required: true }], cta: "Send it", fine: "I’ll remember this address for next time." },
        ]))
        return
      }
      case "review-ask": {
        const formId = mid("review")
        pending.current[formId] = { kind: "review" }
        push(userMsg(chip.label), agent([
          { kind: "text", text: "Who should I ask? Everyone gets the same friendly note — Google doesn’t allow asking only happy customers." },
          { kind: "form", formId, fields: [
            { name: "name", label: "Their first name", type: "text", placeholder: "Maria", required: true },
            { name: "contact", label: "Email or mobile number", type: "text", placeholder: "maria@example.com or (555) 123-4567", required: true },
            { name: "consent", label: "They’re a real customer and happy to hear from me.", type: "checkbox", required: true },
          ], cta: "Ask for a review", fine: "Email goes from your business name, and replies come to you. For a mobile number, I write the text and you send it from your phone. I never ask the same person twice." },
        ]))
        return
      }
      case "profile-add":
      case "location-add":
      case "bing-connect": {
        const formId = mid(a.type)
        pending.current[formId] = { kind: a.type === "profile-add" ? "profile" : a.type === "location-add" ? "location" : "bing" }
        const forms: Record<string, Block[]> = {
          "profile-add": [
            { kind: "text", text: "Paste the link to a profile you have — Facebook, Instagram, LinkedIn, Yelp, YouTube, TikTok, X, Nextdoor or Google. I’ll check it every week and list it in your site’s structured data." },
            { kind: "form", formId, fields: [{ name: "url", label: "Profile link", type: "url", placeholder: "https://www.facebook.com/yourbusiness", required: true }], cta: "Add it" },
          ],
          "location-add": [
            { kind: "text", text: "Tell me about the location. I’ll write its page, give it its own structured data, and track questions for its city." },
            { kind: "form", formId, fields: [
              { name: "name", label: "Location name", type: "text", placeholder: "Downtown", required: true },
              { name: "street", label: "Street address", type: "text", placeholder: "123 Main St", required: true },
              { name: "city", label: "City", type: "text", placeholder: "Austin", required: true },
              { name: "state", label: "State / province", type: "text", placeholder: "TX" },
              { name: "zip", label: "ZIP / postal code", type: "text", placeholder: "78701" },
              { name: "phone", label: "Phone", type: "tel", placeholder: "(512) 555-0100" },
              { name: "hours", label: "Hours", type: "text", placeholder: "Mon–Fri 8–6, Sat 9–1" },
            ], cta: "Add location" },
          ],
          "bing-connect": [
            { kind: "receipt", title: "Connect Bing Webmaster Tools", sub: "about 3 minutes", items: [
              "Go to bing.com/webmasters and sign in. If your site isn’t there, choose “Import from Google Search Console” — it’s verified instantly.",
              "Click the gear (Settings) → API access → API Key → Generate.",
              "Paste the key below. I only use it to read your Bing numbers and tell Bing about new pages.",
            ] },
            { kind: "form", formId, fields: [{ name: "apiKey", label: "Bing API key", type: "text", placeholder: "Paste your key", required: true }], cta: "Connect Bing" },
          ],
        }
        push(userMsg(chip.label), agent(forms[a.type]))
        return
      }
      case "questions-edit": {
        const r = await fetch("/api/agent/questions").then((x) => x.json()).catch(() => null) as { questions?: string[] } | null
        const formId = mid("questions")
        pending.current[formId] = { kind: "questions" }
        push(userMsg(chip.label), agent([
          { kind: "text", text: "These are the questions I ask the four AIs every week. Change any of them — one per line." },
          { kind: "form", formId, fields: [{ name: "questions", label: "Customer questions", type: "textarea", value: (r?.questions ?? []).join("\n"), required: true }], cta: "Save questions" },
        ]))
        return
      }
      case "questions-run": {
        push(userMsg(chip.label))
        const { ok, data } = await post("/api/agent/questions")
        if (!ok) return fail(data.error ?? "I couldn’t start that just now.")
        push(agent([{ kind: "text", text: "Asking all four AIs every question now. It takes a few minutes — the results will be here when you come back." }]))
        return
      }
      case "setting": {
        const { ok, data } = await post("/api/agent/settings", { [a.key]: a.value })
        if (!ok) return fail(data.error ?? "That didn’t save. Try again.")
        push(userMsg(chip.label), agent([{ kind: "text", text: a.done }]))
        return
      }
      case "say":
        push(userMsg(chip.label), agent([{ kind: "text", text: a.text }]))
        return
      case "ask":
        return send(a.text)
      case "live":
        return liveCheck(a.question)
      case "dismiss":
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        return
      case "review-draft": {
        push(userMsg("Draft a reply"))
        setBusy(true)
        const { ok, data } = await post<{ reply?: string }>(`/api/gbp/reviews/${a.reviewId}/reply`, { action: "generate" })
        setBusy(false)
        if (!ok || !data.reply) return fail(data.error ?? "I couldn’t write a draft just now. Try again in a minute.")
        const docId = `reply-${a.reviewId}`
        push(agent([
          { kind: "text", text: "Here’s what I’d say:" },
          { kind: "doc", title: "Your reply · Google", meta: "draft", text: data.reply, docId, editable: true },
          { kind: "chips", items: [{ label: "Post it", action: { type: "review-post", reviewId: a.reviewId, text: data.reply, docId }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
        ]))
        return
      }
      case "review-post": {
        const text = (a.docId && docEdits.current[a.docId]) || a.text
        push(userMsg("Post it"))
        setBusy(true)
        const { ok, data } = await post(`/api/gbp/reviews/${a.reviewId}/reply`, { action: "post", text })
        setBusy(false)
        if (!ok) return fail(data.error ?? "Google didn’t accept the reply. Nothing was posted.")
        push(agent([{ kind: "text", text: "Posted. It’s live on your Google listing." }]))
        setMessages((prev) => prev.filter((m) => m.id !== `review-${a.reviewId}`))
        return
      }
      case "post-publish": {
        push(userMsg("Post it"))
        setBusy(true)
        const { ok, data } = await post(`/api/gbp/posts/${a.postId}/publish`)
        setBusy(false)
        if (!ok) return fail(data.error ?? "Google didn’t accept the post. Nothing was published.")
        push(agent([{ kind: "text", text: "Published to your Google listing." }]))
        return
      }
      case "post-delete": {
        push(userMsg("Delete it"))
        await fetch(`/api/gbp/posts/${a.postId}`, { method: "DELETE" })
        push(agent([{ kind: "text", text: "Deleted. I’ll write a different one next time." }]))
        return
      }
    }
  }

  async function onForm(formId: string, values: Record<string, string | boolean>): Promise<string | null> {
    const p = pending.current[formId]
    if (!p) return "This form expired — tap the button again."
    if (p.kind === "handoff") {
      const email = String(values.email ?? "").trim()
      const { ok, data } = await post("/api/agent/handoff", { what: p.what, email, title: p.title, text: p.text, url: p.url })
      if (!ok) return data.error ?? "It didn’t send. Try again."
      prefs.current.webPersonEmail = email
      push(agent([{ kind: "text", text: `Sent to ${email}. Their reply comes straight to you, and I’ll re-check your site on my next pass to confirm it’s live.` }]))
      return null
    }
    if (p.kind === "shopify") {
      const shop = String(values.shop ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
      const full = shop.includes(".") ? shop : `${shop}.myshopify.com`
      if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(full)) return "That should look like yourstore.myshopify.com."
      window.location.href = `/api/connect/shopify/start?shop=${encodeURIComponent(full)}`
      return null
    }
    if (p.kind === "profile") {
      const { ok, data } = await post("/api/agent/settings", { profileUrl: String(values.url ?? "").trim() })
      if (!ok) return data.error ?? "That link didn’t work."
      push(agent([{ kind: "text", text: "Added. I’ll check it with the rest every week, and include it the next time I update your structured data." }]))
      return null
    }
    if (p.kind === "location") {
      const { ok, data } = await post<{ location?: { id: string; city: string }; upgrade?: boolean }>("/api/agent/locations", values)
      if (!ok) {
        if (data.upgrade) push(agent([{ kind: "text", text: data.error ?? "" }, { kind: "chips", items: [{ label: "See plans", action: { type: "link", href: "/dashboard/billing" }, primary: true }] }]))
        return data.upgrade ? null : data.error ?? "That didn’t save."
      }
      const loc = data.location!
      push(agent([
        { kind: "text", text: `Added your ${loc.city} location. I’ll add questions for ${loc.city} to my weekly checks.` },
        { kind: "chips", items: [{ label: `Write the ${loc.city} page`, action: { type: "draft", topic: `${loc.city} location page`, mode: "location", locationId: loc.id }, primary: true }] },
      ]))
      return null
    }
    if (p.kind === "bing") {
      const { ok, data } = await post<{ site?: string; summary?: unknown }>("/api/agent/bing", { apiKey: String(values.apiKey ?? "").trim() })
      if (!ok) return data.error ?? "Bing didn’t accept that."
      push(agent([{ kind: "text", text: `Connected to Bing for ${data.site}. ✓` }]))
      if (data.summary) push(...bingMessages(data.summary as never).map((m) => ({ ...m, id: mid(m.id) })))
      return null
    }
    if (p.kind === "questions") {
      const list = String(values.questions ?? "").split("\n").map((q) => q.trim()).filter(Boolean)
      const r = await fetch("/api/agent/questions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questions: list }) })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return data.error ?? "Those didn’t save."
      push(agent([{ kind: "text", text: `Saved ${list.length} questions. I’ll ask them on my next weekly pass.` }, { kind: "chips", items: [{ label: "Ask them now", action: { type: "questions-run" }, primary: true }] }]))
      return null
    }
    if (p.kind === "review-link") {
      const { ok, data } = await post("/api/agent/settings", { reviewLink: String(values.link ?? "").trim() })
      if (!ok) return data.error ?? "That doesn’t look like a link."
      push(agent([{ kind: "text", text: "Got it. Now I can ask customers for reviews." }, { kind: "chips", items: [{ label: "Ask a customer for a review", action: { type: "review-ask" }, primary: true }] }]))
      return null
    }
    const { ok, data } = await post<{ via?: "email" | "sms"; smsHref?: string; message?: string; needLink?: boolean }>("/api/agent/review-request", { name: values.name, contact: values.contact, consent: values.consent === true })
    if (data.needLink) {
      const fid = mid("revlink")
      pending.current[fid] = { kind: "review-link" }
      push(agent([
        { kind: "text", text: "I need your Google review link first. Connect Google and I’ll fetch it — or paste it here (Google Business Profile → “Ask for reviews” → copy the link)." },
        { kind: "form", formId: fid, fields: [{ name: "link", label: "Your Google review link", type: "url", placeholder: "https://g.page/r/…", required: true }], cta: "Save it" },
      ]))
      return null
    }
    if (!ok) return data.error ?? "That didn’t work. Try again."
    const first = String(values.name).split(/\s+/)[0]
    if (data.via === "sms" && data.smsHref) {
      push(agent([
        { kind: "text", text: `Here’s the text for ${first}. It comes from your own number, so they know it’s you.` },
        { kind: "doc", title: `Text to ${first}`, meta: "ready to send", text: data.message ?? "" },
        { kind: "chips", items: [
          { label: "Open in Messages", action: { type: "link", href: data.smsHref }, primary: true },
          { label: "Copy it", action: { type: "copy", text: data.message ?? "", done: "Copied." } },
          { label: "Ask someone else", action: { type: "review-ask" } },
        ] },
      ]))
    } else {
      push(agent([{ kind: "text", text: `Sent. ${first} will get a short note from your business with your review link. Replies come to you.` }, { kind: "chips", items: [{ label: "Ask someone else", action: { type: "review-ask" }, primary: true }] }]))
    }
    return null
  }

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q) return
    setInput("")
    push(userMsg(q))
    setBusy(true)
    const history = messages.slice(-12).map((m) => ({ role: m.role, text: m.blocks.filter((b) => b.kind === "text").map((b) => (b as { text: string }).text).join(" ") })).filter((h) => h.text)
    const { ok, data } = await post<{ text?: string; liveQuestion?: string | null }>("/api/agent/chat", { message: q, history, topic: current })
    setBusy(false)
    if (!ok || !data.text) return fail(data.error ?? "I lost the thread for a second. Ask me again?")
    const blocks: Block[] = [{ kind: "text", text: data.text }]
    if (data.liveQuestion) blocks.push({ kind: "chips", items: [{ label: `Ask the AIs: “${data.liveQuestion}”`, action: { type: "live", question: data.liveQuestion }, primary: true }] })
    push(agent(blocks))
  }

  return (
    <>
      <div className="ag-scroll">
        <AgentFeed
          messages={messages}
          animate="stagger"
          busy={busy}
          onChip={onChip}
          onForm={onForm}
          onDocEdit={(id, t) => { docEdits.current[id] = t }}
        />
      </div>
      <nav className="ag-topics" aria-label="Topics">
        {TOPIC_LINKS.map((t) => (
          <Link key={t.href} href={t.href} className={t.href === current ? "on" : ""}>{t.label}</Link>
        ))}
      </nav>
      <Composer id="agent-input" inputRef={inputRef} placeholder="Ask anything… “why doesn’t ChatGPT name us?”" value={input} onChange={setInput} onSubmit={() => send()} disabled={busy} />
    </>
  )
}
