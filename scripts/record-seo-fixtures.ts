// Records ONE live answer per DataForSEO endpoint used by lib/keywords + lib/backlinks into
// scripts/fixtures/dataforseo/ (raw envelopes, for the parser tests). Costs money: run rarely.
//   railway run --service alphaa -- npx tsx scripts/record-seo-fixtures.ts [balance|labs|backlinks [summary-only|rest]]
// Credentials come from the environment and are never printed.
import { writeFileSync, mkdirSync } from "fs"

const DIR = "scripts/fixtures/dataforseo"
const auth = `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN ?? ""}:${process.env.DATAFORSEO_PASSWORD ?? ""}`).toString("base64")}`

async function call(method: "GET" | "POST", path: string, body?: unknown) {
  const r = await fetch(`https://api.dataforseo.com/v3${path}`, { method, headers: { authorization: auth, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(90_000) })
  return (await r.json()) as { status_code: number; status_message: string; cost: number; tasks?: { status_code: number; status_message: string; cost: number }[] }
}

async function record(name: string, path: string, task: Record<string, unknown>) {
  const env = await call("POST", path, [task])
  mkdirSync(DIR, { recursive: true })
  writeFileSync(`${DIR}/${name}.json`, JSON.stringify(env, null, 1))
  const t = env.tasks?.[0]
  console.log(name, env.status_code, t?.status_code, t?.status_message, "cost", env.cost)
  return env.cost ?? 0
}

async function main() {
  const what = process.argv[2] ?? "balance"
  const u = await call("GET", "/appendix/user_data")
  const bal = (u as unknown as { tasks?: { result?: { money?: { balance?: number } }[] }[] }).tasks?.[0]?.result?.[0]?.money?.balance
  console.log("balance before", bal)
  if (what === "balance") return
  let spent = 0
  const kws = ["seo agency ottawa", "local seo", "ai search optimization", "google business profile optimization", "how to rank on chatgpt"]
  if (what === "labs") {
    spent += await record("labs_bulk_keyword_difficulty_live", "/dataforseo_labs/google/bulk_keyword_difficulty/live", { keywords: kws, location_code: 2124, language_code: "en" })
    spent += await record("labs_search_intent_live", "/dataforseo_labs/google/search_intent/live", { keywords: kws, language_code: "en" })
  }
  if (what === "backlinks") {
    if (process.argv[3] !== "rest") spent += await record("backlinks_summary_live", "/backlinks/summary/live", { target: "growthturbine.com", include_subdomains: true, rank_scale: "one_hundred", internal_list_limit: 1, backlinks_status_type: "live" })
    if (process.argv[3] !== "summary-only") {
      const from = new Date(Date.now() - 100 * 86_400_000).toISOString().slice(0, 10)
      spent += await record("backlinks_history_live", "/backlinks/history/live", { target: "growthturbine.com", date_from: from, rank_scale: "one_hundred" })
      spent += await record("backlinks_referring_domains_live", "/backlinks/referring_domains/live", { target: "growthturbine.com", limit: 20, order_by: ["rank,desc"], rank_scale: "one_hundred", internal_list_limit: 1, exclude_internal_backlinks: true, backlinks_status_type: "live" })
      spent += await record("backlinks_domain_intersection_live", "/backlinks/domain_intersection/live", { targets: { "1": "kingscrowd.com", "2": "crowdfundinsider.com", "3": "startengine.com" }, exclude_targets: ["growthturbine.com"], intersection_mode: "all", limit: 20, order_by: ["1.rank,desc"], rank_scale: "one_hundred", internal_list_limit: 1, exclude_internal_backlinks: true })
    }
  }
  console.log("spent", Math.round(spent * 100000) / 100000)
}
main()
