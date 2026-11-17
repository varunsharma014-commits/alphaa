// "What I do without asking": the owner approves once, here, instead of item by item.
// Blog and Google listing posts use the existing autoPublishPosts flag (Pro and up).
// Review replies are honoured by the overnight review-drafts cron. Social, email and ads are
// saved now and take effect as each one goes live on the account (Growth).
import { agent, type Chip, type Message } from "@/lib/agent/types"
import { getAgentSettings, type Autopilot } from "@/lib/agent/settings"
import { hasGrowth } from "@/lib/billing"
import type { User } from "@prisma/client"

const op = (body: Record<string, string>, label: string, on: boolean): Chip => ({
  label: on ? `✓ ${label}` : label,
  action: { type: "agent-op", endpoint: "autopilot", body },
  primary: on,
})

export const PRO_RE = /pro|full|growth/i

export async function autopilotMessages(user: User): Promise<Message[]> {
  const s = await getAgentSettings(user.id)
  const a: Autopilot = s.autopilot ?? {}
  const pro = PRO_RE.test(user.plan)
  const growth = hasGrowth(user)
  const posts = !!s.autoPublishPosts
  const reviews = a.reviews ?? "ask"
  const out: Message[] = []

  out.push(agent([
    { kind: "text", text: "Tell me once what I can do without asking.", big: true },
    { kind: "text", text: "Whatever you choose, every step I take shows up in this chat as I do it, and you can undo the changes I make to your website." },
  ], "ap-intro"))

  out.push(agent([
    { kind: "text", text: "Blog posts and Google listing updates" },
    { kind: "text", text: pro ? "With “without asking”, I only publish posts that have every fact filled in. Anything I’m unsure of still waits for you." : "Publishing without asking comes with the Pro plan. Until then I write them and you approve each one with a tap." },
    { kind: "chips", items: pro
      ? [op({ op: "set", key: "posts", value: "ask" }, "Ask me first", !posts), op({ op: "set", key: "posts", value: "auto" }, "Publish without asking", posts)]
      : [{ label: "See plans", action: { type: "link", href: "/dashboard/settings/billing" } }] },
  ], "ap-posts"))

  out.push(agent([
    { kind: "text", text: "Replies to your Google reviews" },
    { kind: "text", text: reviews === "positive" ? "I post replies to 4 and 5 star reviews myself. Replies to 1 to 3 star reviews wait for you." : "I write a reply to every new review overnight." },
    { kind: "chips", items: [
      op({ op: "set", key: "reviews", value: "ask" }, "Ask me each time", reviews === "ask"),
      op({ op: "set", key: "reviews", value: "positive" }, "Post replies to 4 and 5 stars", reviews === "positive"),
      op({ op: "set", key: "reviews", value: "all" }, "Post every reply", reviews === "all"),
    ] },
  ], "ap-reviews"))

  if (!growth) {
    out.push(agent([
      { kind: "text", text: "Social posts, email campaigns and ads" },
      { kind: "text", text: "These come with the Growth plan: I write and post your social media, send your email campaigns, and build and tune your Google and Meta ads." },
      { kind: "chips", items: [{ label: "See the Growth plan", action: { type: "link", href: "/dashboard/upgrade" }, primary: true }] },
    ], "ap-growth"))
    return out
  }

  const budget = a.adBudget
  out.push(agent([
    { kind: "text", text: "Social posts, email campaigns and ads" },
    { kind: "text", text: "Choose now. Each choice takes effect when that work starts on your account." },
    { kind: "text", text: "Social posts" },
    { kind: "chips", items: [op({ op: "set", key: "social", value: "ask" }, "Ask me first", (a.social ?? "ask") === "ask"), op({ op: "set", key: "social", value: "auto" }, "Post without asking", a.social === "auto")] },
    { kind: "text", text: "Email campaigns to your customers" },
    { kind: "chips", items: [op({ op: "set", key: "email", value: "ask" }, "Ask me before each send", (a.email ?? "ask") === "ask"), op({ op: "set", key: "email", value: "auto" }, "Send without asking", a.email === "auto")] },
    { kind: "text", text: `Ads. Monthly budget: ${budget ? `${budget.toLocaleString("en-US")} a month, never more` : "not set yet"}. Ad spend is billed to you by Google and Meta directly. I never mark it up.` },
    { kind: "chips", items: [
      { label: budget ? "Change my budget" : "Set my monthly budget", primary: !budget, action: { type: "agent-op", endpoint: "autopilot", body: { op: "budget" }, form: {
        text: "What’s the most you want to spend on ads each month, across Google and Meta together?",
        fields: [{ name: "amount", label: "Monthly ad budget", type: "text", placeholder: "500", value: budget ? String(budget) : "", required: true }],
        cta: "Save my budget",
        fine: "A number in the currency you pay Google and Meta in. I never go over it.",
      } } },
      op({ op: "set", key: "ads", value: "each" }, "Ask me before each new campaign", (a.ads ?? "each") === "each"),
      op({ op: "set", key: "ads", value: "budget" }, "Run campaigns within my budget", a.ads === "budget"),
    ] },
  ], "ap-growth"))
  return out
}
