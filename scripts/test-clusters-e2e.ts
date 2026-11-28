// End-to-end run of topic clusters + the originality check against REAL websites, on a LOCAL
// database only (refuses anything but localhost). Nothing is published and no email is sent:
//   tracked AI questions (written from the real site) + gap analysis (the competitor's real pages)
//   → cluster map (one Sonnet call, validated) → writePost picks the next unwritten article →
//   brief links its pillar/siblings → originality check of that draft (pages + Google when
//   DataForSEO is configured) → a planted copy of the competitor's page is held → "Rewrite these lines".
// Costs a few cents of Claude (+ ~10 live Google searches with DataForSEO, $0.002 each).
//   npx tsx --env-file=.env.local scripts/test-clusters-e2e.ts --site growthturbine.com --rival dealmaker.tech --type "fundraising marketing agency"
import * as React from "react"

const react = ((React as unknown as { default?: object }).default ?? React) as { cache?: unknown }
if (typeof react.cache !== "function") react.cache = <T,>(f: T) => f

const arg = (k: string, d = "") => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d }

async function main() {
  const url = process.env.DATABASE_URL ?? ""
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) throw new Error("Refusing to run: DATABASE_URL is not a local database.")
  const site = arg("site"), rival = arg("rival"), type = arg("type", "business")
  if (!site || !rival) throw new Error("--site and --rival are required")
  const { db } = await import("../src/lib/db")
  const { runAsUser } = await import("../src/lib/usage")
  const { analyzeContentGaps } = await import("../src/lib/content-gaps")
  const { trackedQuestions } = await import("../src/lib/questions")
  const { buildClusters, clusterView, nextClusterArticle } = await import("../src/lib/clusters")
  const { writePost } = await import("../src/lib/content")
  const { getBrief } = await import("../src/lib/content-brief")
  const { checkDraft, rewriteFlagged, originalityGate } = await import("../src/lib/originality")
  const { readArticle } = await import("../src/lib/page-reader")

  const user = await db.user.upsert({
    where: { clerkId: "e2e:clusters" },
    update: { websiteUrl: site, businessType: type, plan: "pro", subscriptionStatus: "active" },
    create: { clerkId: "e2e:clusters", email: "e2e-clusters@example.test", businessName: arg("name", site.split(".")[0]), businessType: type, websiteUrl: site, plan: "pro", subscriptionStatus: "active", onboardingCompleted: true },
  })
  await runAsUser(user.id, async () => {
    const t0 = Date.now()
    const lap = (s: string) => console.log(`\n[${((Date.now() - t0) / 1000).toFixed(0)}s] ${s}`)

    lap("Tracked AI questions (written once from the real site)")
    const qs = await trackedQuestions(user.id)
    for (const q of qs) console.log(`  - ${q}`)

    if (!(await db.contentGap.findFirst({ where: { userId: user.id } }))) {
      lap(`Gap analysis: ${site} vs ${rival}`)
      const g = await analyzeContentGaps(site, rival, user.businessName ?? "", type, user.city ?? "")
      console.log(`  read ${g.read} of their pages; ${g.gaps.length} gaps`)
      if (g.gaps.length) await db.contentGap.create({ data: { userId: user.id, competitorUrl: `https://${rival}`, gaps: g.gaps as object, summary: g.summary } })
    }

    if (process.argv.includes("--rebuild") || !(await clusterView(user.id))) {
      lap("Building the cluster map")
      const r = await buildClusters(user, { reason: "owner" })
      if (!r.ok) throw new Error(r.error)
      console.log(`  inputs: ${JSON.stringify(r.map.inputs)} · dropped ${r.map.dropped}`)
    }
    const v = (await clusterView(user.id))!
    for (const c of v.clusters) {
      console.log(`  ■ ${c.title} — ${c.written} of ${c.total} written · ${c.why}`)
      for (const a of [c.pillar, ...c.articles]) console.log(`     ${a.pillar ? "★" : "-"} [${a.status}] ${a.title}  ← ${a.sources.map((s) => `${s.label}: ${s.text.slice(0, 50)}`).join(" | ")}${a.liveUrl ? `  (${a.liveUrl})` : ""}`)
    }

    const only = process.argv.includes("--only-originality")
    let p: { markdown: string; briefId?: string | null } = { markdown: "" }
    if (only) {
      const last = await db.mockActivity.findFirst({ where: { userId: user.id, type: "post_draft", title: { startsWith: "Drafted a post" } }, orderBy: { createdAt: "desc" } })
      p = (last?.metadata ?? {}) as typeof p
    } else {
      lap("writePost with no topic: picks the next unwritten article")
      const next = await nextClusterArticle(user.id)
      console.log(`  next: ${next?.title} (${next?.ref}) in “${next?.pillar}”`)
      const w = await writePost(user, undefined, {})
      console.log(`  wrote “${w.title}” · topic “${w.topic}” · cluster ${w.cluster} · ${w.markdown.split(/\s+/).length} words · checks ${JSON.stringify(w.checks)}`)
      if (w.cluster !== next?.ref) throw new Error("writePost didn't take the next cluster article")
      const brief = await getBrief(user.id, w.briefId)
      console.log(`  brief links: ${brief?.internalLinks.map((l) => `${l.anchor} → ${l.url}`).join(" · ")}`)
      console.log(`  brief cluster: ${JSON.stringify(brief?.cluster)}`)
      const row = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: `Drafted a post: “${w.title}”`, metadata: { ...w, status: "ready", imageId: null } as object } })
      const v2 = (await clusterView(user.id))!
      const after = v2.clusters.flatMap((c) => [c.pillar, ...c.articles]).find((a) => a.ref === w.cluster)
      console.log(`  status now: ${after?.status} (draft ${after?.openDraftId})`)

      lap("Originality check of the written draft")
      const o1 = await checkDraft(user.id, row.id)
      console.log(`  Original: ${o1?.original}% · blocked ${o1?.blocked} · passages ${o1?.passages.length} · read ${JSON.stringify(o1?.read)} · web ${o1?.web.ran ? `${o1.web.sentences.length} searched` : o1?.web.note}`)
      for (const x of o1?.passages ?? []) console.log(`    “${x.text.slice(0, 120)}” (${x.words}w) ← ${x.url}`)
      p = w
    }

    lap("Planted copy: the competitor page's own paragraphs")
    const brief = await getBrief(user.id, p.briefId ?? null)
    // The brief's competitor page, else a content page from the rival's own sitemap.
    let compUrl = brief?.competitor?.url ?? null
    if (!compUrl) {
      const { readSitemap, pickCompetitorPages } = await import("../src/lib/page-reader")
      for (const u of pickCompetitorPages((await readSitemap(rival, 300)).urls, { max: 8 })) { const a = await readArticle(u.url, 60_000); if (a.ok && a.page.words > 400) { compUrl = u.url; break } }
    }
    const art = compUrl ? await readArticle(compUrl, 60_000) : null
    if (art?.ok) {
      const copied = art.page.text.split(/(?<=[.!?])\s+/).filter((s) => s.split(/\s+/).length >= 10).slice(0, 12).join(" ")
      const md = `${p.markdown.split("\n\n").slice(0, 6).join("\n\n")}\n\n${copied}`
      // A brief that read that page, so the check compares with it (as a real Draft it would).
      const pb = await db.mockActivity.create({ data: { userId: user.id, type: "content_brief", title: "e2e brief", metadata: { v: 1, competitor: { url: compUrl, title: art.page.title, read: true }, gapId: null } as object } })
      const planted = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: "Planted copy (e2e)", metadata: { title: "Planted copy", markdown: md, status: "ready", briefId: pb.id } as object } })
      const gate = await originalityGate(user.id, { draftId: planted.id })
      console.log(`  gate: ${gate.ok ? "PASSED (unexpected)" : `HELD · ${gate.error}`}`)
      if (gate.ok) throw new Error("a copied page should be held")
      console.log(`  ${gate.result.passages.length} passages, ${gate.result.passages.reduce((n, x) => n + x.sentences.length, 0)} sentences flagged`)
      console.log(`  sources: ${gate.result.sources.map((s) => `${s.url} ${s.pct}% (${s.runs25} runs of 25+)`).join(" · ")}`)
      lap("Rewrite these lines")
      const rw = await rewriteFlagged(user, planted.id)
      if (!rw.ok) throw new Error(rw.error)
      console.log(`  rewrote ${rw.changed} lines · now Original: ${rw.result?.original}% · blocked ${rw.result?.blocked} · ${rw.result?.reason ?? ""}`)
      for (const x of (rw.result?.passages ?? []).slice(0, 4)) console.log(`    still: “${x.text.slice(0, 140)}” (${x.words}w) ← ${x.url}`)
    } else console.log(`  (couldn't read a competitor page to plant: ${compUrl})`)
  })
  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
