// The "Social" thread: connected accounts, connect buttons, and the post queue
// (drafts to approve, what's scheduled, what went out).
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import { imageUrl } from "@/lib/images"
import { statsLine } from "@/lib/social/stats"
import { PLATFORM_NAME, PROVIDER_NAME, PROVIDERS, providerConfigured, type SocialAccount, type SocialPost } from "@/lib/social/types"

const op = (body: Record<string, string>, label: string, primary = false): Chip => ({ label, primary, action: { type: "agent-op", endpoint: "social", body } })
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "")

export function socialMessages(o: { growth: boolean; accounts: SocialAccount[]; posts: SocialPost[]; note?: string | null }): Message[] {
  if (!o.growth) {
    return [agent([
      { kind: "text", text: "Your social media, handled every week.", big: true },
      { kind: "text", text: "On the Pro plan I connect to your Facebook, Instagram and LinkedIn, write posts in your voice with images in your brand colours, and post them on schedule." },
      { kind: "chips", items: [{ label: "See the Pro plan", action: { type: "link", href: "/dashboard/upgrade?plan=pro" }, primary: true }] },
    ], "so-upgrade")]
  }
  const out: Message[] = []
  if (o.note) out.push(agent([{ kind: "text", text: o.note }]))

  const ready = PROVIDERS.filter(providerConfigured)
  const soon = PROVIDERS.filter((p) => !providerConfigured(p))
  const blocks: Block[] = [
    { kind: "text", text: o.accounts.length ? "Your social accounts." : "Connect your social accounts and I’ll post for you.", big: true },
  ]
  if (o.accounts.length) {
    blocks.push({ kind: "sources", items: o.accounts.map((a) => ({ name: a.name, detail: `${PLATFORM_NAME[a.platform]}${a.handle && !a.name.includes(a.handle) ? ` · @${a.handle}` : ""}`, status: a.status === "active" ? "Connected" : "Reconnect", ok: a.status === "active" })) })
  } else {
    blocks.push({ kind: "text", text: "One secure click each. You log in on the platform itself; I never see your password, and you can disconnect any time." })
  }
  if (ready.length) blocks.push({ kind: "chips", items: ready.map((p, i) => ({ label: o.accounts.some((a) => (p === "meta" ? a.platform === "facebook" || a.platform === "instagram" : p === "linkedin_pages" ? a.platform === "linkedin" && a.extra?.kind === "organization" : p === "linkedin" ? a.platform === "linkedin" && a.extra?.kind !== "organization" : a.platform === p)) ? `Reconnect ${PROVIDER_NAME[p]}` : `Connect ${PROVIDER_NAME[p]}`, primary: i === 0 && !o.accounts.length, action: { type: "link", href: `/api/social/connect/${p}` } })) })
  if (soon.length) blocks.push({ kind: "text", text: `${soon.map((p) => PROVIDER_NAME[p]).join(", ")}: coming soon. Until then, I write the posts and you copy them with one tap.` })
  out.push(agent(blocks, "so-accounts"))

  const byId = new Map(o.accounts.map((a) => [a.id, a]))
  const where = (p: SocialPost) => Array.from(new Set(p.accountIds.map((id) => byId.get(id)).filter(Boolean).map((a) => PLATFORM_NAME[a!.platform]))).join(", ") || "no account"
  const open = o.posts.filter((p) => p.status === "draft" || p.status === "scheduled" || p.status === "failed" || p.status === "partial").slice(0, 8)
  const sent = o.posts.filter((p) => p.status === "published").slice(0, 5)

  if (open.length) {
    out.push(agent([{ kind: "text", text: open.some((p) => p.status === "draft") ? "Posts waiting for you, and what’s coming up:" : "Coming up:" }], "so-queue-h"))
    for (const p of open) {
      const meta = p.status === "draft" ? "needs your OK" : p.status === "scheduled" ? `scheduled ${when(p.scheduledFor)}` : p.status === "partial" ? "posted to some accounts" : "didn’t post"
      const blocks: Block[] = [{ kind: "doc", title: p.title ?? "Social post", meta: `${meta} · ${where(p)}`, text: p.text, image: p.imageId ? imageUrl(p.imageId) : undefined, square: true }]
      const errs = (p.results ?? []).filter((r) => !r.ok)
      if (errs.length) blocks.push({ kind: "text", text: errs.map((r) => `${PLATFORM_NAME[r.platform]}: ${r.error}`).join(" · ") })
      const chips: Chip[] =
        p.status === "draft" ? [op({ op: "approve", id: p.id }, p.scheduledFor ? `Approve for ${when(p.scheduledFor)}` : "Approve", true), op({ op: "post_now", id: p.id }, "Post now"), op({ op: "delete", id: p.id }, "Delete")]
          : p.status === "scheduled" ? [op({ op: "post_now", id: p.id }, "Post now instead"), op({ op: "unschedule", id: p.id }, "Hold it"), op({ op: "delete", id: p.id }, "Delete")]
            : [op({ op: "post_now", id: p.id }, "Try again", true), op({ op: "delete", id: p.id }, "Delete")]
      if (!p.accountIds.length) chips.splice(0, chips.length - 1, { label: "Copy the post", action: { type: "copy", text: p.text, done: "Copied." }, primary: true })
      blocks.push({ kind: "chips", items: chips })
      out.push(agent(blocks, `so-p-${p.id}`))
    }
  } else if (o.accounts.length) {
    out.push(agent([{ kind: "text", text: "Nothing in the queue. Say “run my marketing for this week” and I’ll write and schedule your posts." }], "so-queue-h"))
  }

  if (sent.length) {
    const numbers = (p: SocialPost) => (p.results ?? []).map((r) => (r.ok && r.stats ? `${PLATFORM_NAME[r.platform]}: ${statsLine(r.stats)}` : null)).filter(Boolean).join(" · ")
    const profileOnly = sent.some((p) => (p.results ?? []).some((r) => r.ok && r.platform === "linkedin" && byId.get(r.accountId)?.extra?.kind !== "organization"))
    out.push(agent([{ kind: "receipt", title: "Recently posted", items: sent.map((p) => { const n = numbers(p); return `${when(p.publishedAt)} · ${where(p)} · ${(p.title ?? p.text).slice(0, 70)}${n ? ` · ${n}` : ""}` }) },
      ...(profileOnly ? [{ kind: "text" as const, text: "LinkedIn doesn’t share numbers for posts on a personal profile. Connect your company page and I’ll show views, likes and comments for each post." }] : []), { kind: "chips", items: sent.flatMap((p) => (p.results ?? []).filter((r) => r.ok && r.url).slice(0, 1).map((r) => ({ label: `See it on ${PLATFORM_NAME[r.platform]}`, action: { type: "link" as const, href: r.url! } }))).slice(0, 4) }], "so-sent"))
  }

  if (o.accounts.length) out.push(agent([{ kind: "chips", items: o.accounts.map((a) => op({ op: "disconnect", id: a.id }, `Disconnect ${a.name}`)) }], "so-manage"))
  return out
}
