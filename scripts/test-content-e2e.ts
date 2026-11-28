// End-to-end run of the long-form content pipeline against REAL websites, on a LOCAL database
// only (refuses anything but localhost). Nothing is published and no email is sent:
//   gap analysis (reads the competitor's real pages) → brief → writer (facts-only numbers,
//   internal links) → blog cover (owner's image style) → HTML per platform (WordPress, Webflow,
//   Shopify, Wix Ricos) → Repurpose into social / LinkedIn / Google / email / video drafts.
// Costs a few cents of Claude. Files land in the --out folder (cover.jpg, post.md, post-*.html).
//   npx tsx --env-file=.env.local scripts/test-content-e2e.ts --site growthturbine.com --rival dealmaker.tech --type "fundraising marketing agency" --out /tmp/e2e
import * as React from "react"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

const react = ((React as unknown as { default?: object }).default ?? React) as { cache?: unknown }
if (typeof react.cache !== "function") react.cache = <T,>(f: T) => f

const arg = (k: string, d = "") => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d }

async function main() {
  const url = process.env.DATABASE_URL ?? ""
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) throw new Error("Refusing to run: DATABASE_URL is not a local database.")
  const site = arg("site"), rival = arg("rival"), type = arg("type", "business"), out = arg("out", path.join(process.cwd(), ".e2e-content"))
  if (!site || !rival) throw new Error("--site and --rival are required")
  mkdirSync(out, { recursive: true })
  const { db } = await import("../src/lib/db")
  const { runAsUser } = await import("../src/lib/usage")
  const { analyzeContentGaps } = await import("../src/lib/content-gaps")
  const { buildBrief } = await import("../src/lib/content-brief")
  const { writePost } = await import("../src/lib/content")
  const { blogCoverFor } = await import("../src/lib/blog-cover")
  const { mdToHtml } = await import("../src/lib/markdown")
  const { htmlForPlatform } = await import("../src/lib/connector/html-adapt")
  const { htmlToRicos } = await import("../src/lib/connector/wix")
  const { hasPlaceholders } = await import("../src/lib/brackets")
  const { repurposePost } = await import("../src/lib/repurpose")

  const user = await db.user.upsert({
    where: { clerkId: "e2e:content-pipeline" },
    update: { websiteUrl: site, businessType: type, plan: "pro", subscriptionStatus: "active" },
    create: { clerkId: "e2e:content-pipeline", email: "e2e-content-pipeline@example.test", businessName: arg("name", site.split(".")[0]), businessType: type, websiteUrl: site, plan: "pro", subscriptionStatus: "active", onboardingCompleted: true },
  })
  await runAsUser(user.id, async () => {
    const t0 = Date.now()
    const lap = (s: string) => console.log(`\n[${((Date.now() - t0) / 1000).toFixed(0)}s] ${s}`)

    lap(`Gap analysis: ${site} vs ${rival}`)
    const g = await analyzeContentGaps(site, rival, user.businessName ?? "", type, user.city ?? "")
    console.log(`  read ${g.read} of their pages: ${g.pages.map((p) => `${p.url} (${p.words}w)`).join(", ")}`)
    console.log(`  ${g.summary}`)
    for (const x of g.gaps) console.log(`  - [${x.priority}] ${x.suggestedTitle}  ← ${x.sourceUrl} ${x.read ? `(${x.sourceWords}w, ${x.sourceHeadings?.length} headings)` : "(sitemap only)"}`)
    if (!g.gaps.length) throw new Error("no gaps")
    const row = await db.contentGap.create({ data: { userId: user.id, competitorUrl: `https://${rival}`, gaps: g.gaps as object, summary: g.summary } })
    const pick = Math.max(0, g.gaps.findIndex((x) => x.read))
    const gap = g.gaps[pick]

    lap(`Brief for “${gap.suggestedTitle}”`)
    const brief = await buildBrief(user, { topic: gap.suggestedTitle, gapId: `${row.id}:${pick}`, fresh: true })
    console.log(JSON.stringify({ ...brief, facts: brief.facts.map((f) => `${f.text} [${f.source}]`) }, null, 2))

    lap("Writing the post from the brief")
    const p = await writePost(user, gap.suggestedTitle, { brief })
    const words = p.markdown.split(/\s+/).length
    console.log(`  “${p.title}” · ${words} words · checks ${JSON.stringify(p.checks)} · placeholders left: ${hasPlaceholders(p.markdown)}`)
    console.log(`  excerpt: ${p.excerpt}`)
    writeFileSync(path.join(out, "post.md"), `# ${p.title}\n\n${p.markdown}\n`)

    lap("Cover image (owner's style; default = wide text card)")
    const cover = await blogCoverFor(user.id, { title: p.title, topic: p.topic })
    if (cover) {
      const img = await db.mockActivity.findUnique({ where: { id: cover.id } })
      writeFileSync(path.join(out, "cover.jpg"), Buffer.from((img!.metadata as { b64: string }).b64, "base64"))
      console.log(`  ${cover.kind} · alt: ${cover.alt}`)
    }

    lap("HTML per platform (dry run, nothing published)")
    const html = mdToHtml(p.markdown, { siteUrl: site })
    for (const pl of ["wordpress", "webflow", "shopify", "wix"] as const) {
      const h = htmlForPlatform(html, pl)
      writeFileSync(path.join(out, `post-${pl}.html`), h)
      if (pl === "wix") console.log(`  wix: ${JSON.stringify(htmlToRicos(h).nodes.map((n) => n.type).reduce((a, t) => ({ ...a, [t]: (a[t] ?? 0) + 1 }), {} as Record<string, number>))}`)
      else console.log(`  ${pl}: ${h.length} chars, ${(h.match(/<a /g) ?? []).length} links, tables ${(h.match(/<table/g) ?? []).length}`)
    }

    lap("Repurpose (drafts only, local DB)")
    const draft = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: `Drafted a post: “${p.title}”`, metadata: { ...p, status: "published", url: `https://${site}/blog/e2e-local-test-not-published`, imageId: cover?.id ?? null } as object } })
    const r = await repurposePost(user, draft.id)
    for (const i of r.items) console.log(`\n  ## ${i.kind} · ${i.status} · ${i.where || i.note}\n${(i.text ?? "").split("\n").map((l) => `     ${l}`).join("\n")}`)
    lap("Done")
  })
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
