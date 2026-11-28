// Live check of the PAID keyword path through the shared client: keywordMetrics() with Labs ON for
// ONE keyword (about $0.025: difficulty + intent), as the brand (data_usd is recorded for it).
//   railway run --service alphaa -- sh -c 'DATABASE_URL=$DATABASE_BUILD_URL npx tsx scripts/probe-keyword-labs.ts <websiteUrl> "<keyword>"'
import { db } from "@/lib/db"
import { keywordMetrics } from "@/lib/keywords/data"
import { runAsUser, flush } from "@/lib/usage"

async function main() {
  const user = await db.user.findFirst({ where: { websiteUrl: { contains: process.argv[2] ?? "alphaa.app" } }, orderBy: { createdAt: "asc" } })
  if (!user) process.exit(1)
  const kw = process.argv[3] ?? "ottawa seo"
  const r = await runAsUser(user.id, () => keywordMetrics(user, [kw], { labsMax: 1 }))
  console.log("note", JSON.stringify(r.note))
  const m = r.metrics.get(kw)
  console.log(kw, "| volume", m?.volume?.avg, "| difficulty", m?.difficulty, "| intent", m?.intent, m?.intentP)
  await flush().catch(() => null)
  process.exit(0)
}
main()
