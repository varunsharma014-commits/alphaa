export const dynamic = "force-dynamic"
export const maxDuration = 60

// The editor's On-page panel (components/editor/OnPageCard.tsx, lib/onpage-grade.ts).
// GET = what the live score needs besides the text: the brief's keyword + planned links (and a
//       pillar/siblings when the brief has them), topic terms from the pages ranking for it
//       (lib/onpage-terms.ts, computed once per brief), the site's host, the summary, cover alt.
// PUT { excerpt } = save the summary that goes out as the excerpt / description.
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings } from "@/lib/agent/settings"
import { briefTerms, saveExcerpt } from "@/lib/onpage-terms"
import { getBrief } from "@/lib/content-brief"

type DraftMeta = { briefId?: string | null; excerpt?: string; imageId?: string | null; status?: string; refresh?: unknown }
type Link = { url: string; title?: string; anchor?: string }

const asLink = (v: unknown): Link | null => {
  if (!v || typeof v !== "object") return null
  const o = v as Record<string, unknown>
  return typeof o.url === "string" && /^https?:\/\//.test(o.url) ? { url: o.url, title: typeof o.title === "string" ? o.title : typeof o.anchor === "string" ? o.anchor : undefined } : null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const row = await db.mockActivity.findFirst({ where: { id, userId: user.id, type: "post_draft" }, select: { metadata: true } })
  if (!row) return NextResponse.json({ error: "That draft isn’t here any more." }, { status: 404 })
  const m = (row.metadata ?? {}) as DraftMeta
  const [settings, brief, cover] = await Promise.all([
    getAgentSettings(user.id),
    getBrief(user.id, m.briefId ?? null).catch(() => null),
    m.imageId ? db.mockActivity.findFirst({ where: { id: m.imageId, userId: user.id, type: "post_image" }, select: { metadata: true } }).catch(() => null) : Promise.resolve(null),
  ])
  const terms = brief?.id ? await briefTerms(user.id, brief.id, user.businessName).catch((e) => { console.error("[onpage] terms", e instanceof Error ? e.message : e); return null }) : null
  // Topic clusters may add a pillar / sibling pages to a brief: use them when present, whatever their shape.
  const b = (brief ?? {}) as unknown as Record<string, unknown>
  const pillar = asLink(b.pillar)
  const siblings = (Array.isArray(b.siblings) ? b.siblings : []).map(asLink).filter((x): x is Link => !!x).slice(0, 6)
  return NextResponse.json({
    context: {
      keyword: brief?.keyword ?? null,
      internalTargets: (brief?.internalLinks ?? []).map((l) => ({ url: l.url, anchor: l.anchor })),
      pillar,
      siblings,
      terms: terms?.terms ?? [],
      termPages: terms?.termPages ?? 0,
      siteHost: settings.wp?.siteUrl ?? settings.site?.siteUrl ?? user.websiteUrl ?? null,
      excerpt: m.excerpt ?? "",
      coverAlt: m.imageId ? !!(cover?.metadata as { alt?: string } | null)?.alt : undefined,
    },
    termSources: terms?.termSources ?? [],
    hasBrief: !!brief,
    locked: m.status === "published",
  })
}

const body = z.object({ excerpt: z.string().max(400) })

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const row = await db.mockActivity.findFirst({ where: { id, userId: user.id, type: "post_draft" } })
  if (!row) return NextResponse.json({ error: "That draft isn’t here any more." }, { status: 404 })
  const m = (row.metadata ?? {}) as DraftMeta
  if (m.status === "published") return NextResponse.json({ error: "This post is live, so the summary is read only here." }, { status: 409 })
  await saveExcerpt(user.id, id, input.excerpt)
  return NextResponse.json({ ok: true })
}
