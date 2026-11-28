// Live check of the FREE keyword path: Alphaa's Keyword Planner connection (lib/keywords/planner.ts)
// through keywordMetrics() with Labs OFF (no DataForSEO spend), for one brand. Writes that brand's
// keyword_data cache row. Prints numbers only, never tokens.
//   railway run --service alphaa -- sh -c 'DATABASE_URL=$DATABASE_BUILD_URL npx tsx scripts/probe-keyword-planner.ts <websiteUrl> kw1,kw2'
import { db } from "@/lib/db"
import { keywordMetrics, cachedMetrics, keywordIdeas } from "@/lib/keywords/data"
import { volumeLabel } from "@/lib/keywords/rules"

async function main() {
  const site = process.argv[2] ?? "alphaa.app"
  const kws = (process.argv[3] ?? "ai search optimization,local seo,seo agency ottawa,how to show up in chatgpt").split(",")
  const user = await db.user.findFirst({ where: { websiteUrl: { contains: site } }, orderBy: { createdAt: "asc" } })
  if (!user) { console.log("no brand for", site); process.exit(1) }
  console.log("brand", user.id, user.city, user.state)
  const t = Date.now()
  const { metrics, note } = await keywordMetrics(user, kws, { labs: false })
  console.log("note", JSON.stringify(note), `${Date.now() - t}ms`)
  for (const [k, m] of metrics) console.log(" ", k, "|", volumeLabel(m.volume), "| comp", m.competition, "| bids", m.bidLow, m.bidHigh, m.currency)
  const cached = await cachedMetrics(user, kws)
  console.log("cached rows", cached.size)
  const ideas = await keywordIdeas(user, (process.argv[4] ?? user.businessType ?? "seo agency").split(","), 10)
  console.log("ideas", ideas.join(" | "))
  process.exit(0)
}
main()
