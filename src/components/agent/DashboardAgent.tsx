"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AgentFeed, Composer } from "./AgentFeed"
import { agent, mid, user as userMsg, type Block, type Chip, type Message, type SiteOp } from "@/lib/agent/types"
import type { EngineKey } from "@/lib/agent/types"
import { siteCheckBlocks, describeSchemas } from "@/lib/agent/site-narration"
import { citationBlocks, discussionMessages } from "@/lib/agent/thread-blocks"

type LiveResult = { engine: EngineKey; answer: string; appeared: boolean; mentioned: string[]; status: string }

type Task = "site-check" | "citations" | "schema"
type Prefs = { webPersonEmail: string | null; wpConnected: boolean }
type Pending =
  | { kind: "handoff"; what: SiteOp; title?: string; text?: string }
  | { kind: "review" }
  | { kind: "review-link" }

const OP_NAME: Record<SiteOp, string> = { page: "the page", schema: "your structured facts", llms: "your llms.txt", robots: "the robots.txt fix" }
const TOPIC_LINKS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/t/reviews", label: "Reviews" },
  { href: "/dashboard/t/site", label: "Site Schema & Code" },
  { href: "/dashboard/t/sources", label: "Source Tracking" },
  { href: "/dashboard/t/listings", label: "Maps & Listings" },
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
  const prefs = useRef<Prefs>({ webPersonEmail: null, wpConnected: false })
  const pending = useRef<Record<string, Pending>>({})

  async function loadPrefs() {
    const r = await fetch("/api/agent/settings").then((x) => (x.ok ? x.json() : null)).catch(() => null)
    if (r) prefs.current = { webPersonEmail: r.webPersonEmail ?? null, wpConnected: !!r.wpConnected }
  }

  // Who makes a website change happen: the agent itself when the site is
  // connected; otherwise the owner's web person (by email) or our team.
  function siteChips(op: SiteOp, extra: { title?: string; text?: string; docId?: string } = {}): Chip[] {
    const handoff: Chip = { label: "Email it to my web person", action: { type: "handoff", what: op, ...extra } }
    if (prefs.current.wpConnected) return [{ label: "Publish it to my site", action: { type: "wp-push", op, ...extra }, primary: true }, handoff]
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
      await runTask("schema")
      if (data.userId) {
        const llms = `${window.location.origin}/llms/${data.userId}`
        push(agent([
          { kind: "text", text: "I also keep the file AI assistants read first — your llms.txt — up to date for you." },
          { kind: "doc", title: "llms.txt · kept current by Alphaa", meta: "hosted by Alphaa", text: llms },
          { kind: "chips", items: [...siteChips("llms"), { label: "Copy the link", action: { type: "copy", text: llms, done: "Copied." } }] },
        ]))
      }
      if (!prefs.current.wpConnected) {
        push(agent([
          { kind: "text", text: "Want me to make these changes myself?" },
          { kind: "text", text: "If your site runs on WordPress, install my plugin once. After that, every fix is one tap — “Publish it to my site” — and every change has an Undo." },
          { kind: "chips", items: [{ label: "Connect my WordPress site", action: { type: "wp-connect" }, primary: true }, { label: "Not WordPress", action: { type: "say", text: "No problem. Tap “Email it to my web person” on any fix and I’ll send them the exact code, where it goes and how to check it — or our team can do it for you on Full Service." } }] },
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
        push(agent([{ kind: "text", text: "On it." }, { kind: "steps", items: ["Working"], done: 0 }], a.task === "citations" ? "src-run" : a.task === "site-check" ? "st-run" : undefined))
        return runTask(a.task)
      case "draft": {
        push(userMsg(chip.label))
        setBusy(true)
        const { ok, data } = await post<{ title?: string; text?: string }>("/api/agent/draft", { topic: a.topic, competitor: a.competitor, mode: a.mode, url: a.url })
        setBusy(false)
        if (!ok || !data.text) return fail(data.error ?? "I couldn’t write that just now.")
        const docId = `draft-${Date.now()}`
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
      case "wp-connect": {
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
            { kind: "chips", items: [{ label: "Check again", action: { type: "wp-connect" }, primary: true }, { label: "Email my web person instead", action: { type: "handoff", what: "schema" } }] },
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
            { label: "I’ve connected it", action: { type: "wp-connect" } },
          ] },
          { kind: "text", text: "Nothing goes live until you approve it here, pages are never deleted (Undo moves them to WordPress’s Trash), and the plugin only counts visitors who arrive from an AI assistant — no cookies, nothing personal." },
        ]))
        return
      }
      case "wp-push": {
        const text = (a.docId && docEdits.current[a.docId]) || a.text
        push(userMsg(`Publish ${OP_NAME[a.op]}`))
        setBusy(true)
        const { ok, data } = await post<{ url?: string; changeId?: string; indexed?: boolean; shadowed?: boolean }>("/api/connect/wp/push", { op: a.op, title: a.title, text })
        setBusy(false)
        if (!ok || !data.url) return fail(data.error ?? "Your site didn’t accept it. Nothing changed.")
        const blocks: Block[] = [
          { kind: "text", text: `Done — it’s live on your site.`, big: true },
          { kind: "doc", title: "Live at", meta: "published", text: data.url },
        ]
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
        push(agent([{ kind: "text", text: "Undone. Your site is back the way it was. (Pages go to WordPress’s Trash, so you can restore them there too.)" }]))
        return
      }
      case "handoff": {
        const text = (a.docId && docEdits.current[a.docId]) || a.text
        const formId = mid("handoff")
        pending.current[formId] = { kind: "handoff", what: a.what, title: a.title, text }
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
      case "setting": {
        await post("/api/agent/settings", { [a.key]: a.value })
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
      const { ok, data } = await post("/api/agent/handoff", { what: p.what, email, title: p.title, text: p.text })
      if (!ok) return data.error ?? "It didn’t send. Try again."
      prefs.current.webPersonEmail = email
      push(agent([{ kind: "text", text: `Sent to ${email}. Their reply comes straight to you, and I’ll re-check your site on my next pass to confirm it’s live.` }]))
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
