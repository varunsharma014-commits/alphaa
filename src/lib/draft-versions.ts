// Saved website/blog drafts + their version history (server only).
//
// The draft is the post_draft MockActivity row: metadata.markdown/title ARE the saved text, and
// every publish path (chat "Publish it", Research "Draft it", the schedule cron, email approval
// links) publishes what is saved here. The editor autosaves into it (no revision per keystroke);
// checkpoints (a manual save, a publish, an AI rewrite, a restore) also write one immutable
// revision row: MockActivity type "post_revision", metadata { draftId, markdown, title, by,
// reason }. The first change to a draft first records the agent's original as a revision.
import { auditActor } from "@/lib/activity"
import { whoName } from "@/lib/team/permissions"
import { db } from "@/lib/db"
import { countPostWords } from "@/lib/content-grade"
import { imageUrl } from "@/lib/images"

export const REVISION_TYPE = "post_revision"
export const MAX_DRAFT_CHARS = 30_000 // = pushBody text max (lib/connector/push.ts)

export type RevisionBy = "owner" | "agent"
export type RevisionReason = "original" | "save" | "publish" | "ai_rewrite" | "restore"

type DraftMeta = {
  title?: string; markdown?: string; excerpt?: string; topic?: string; status?: string; url?: string
  scheduledFor?: string; imageId?: string | null; rev?: number; editedAt?: string; editedBy?: RevisionBy
}
type RevMeta = { draftId: string; markdown: string; title?: string; by: RevisionBy; reason: RevisionReason; words?: number; restoredFrom?: string; actor?: { name?: string | null; email?: string | null; role?: string } }

export type SavedDraft = {
  id: string; title: string; markdown: string; excerpt: string | null; status: string; url: string | null
  scheduledFor: string | null; rev: number; editedAt: string | null; editedBy: RevisionBy | null; createdAt: string; image: string | null
}
/** `who`: the team member's first name when someone other than the owner alone saved it (lib/team). */
export type RevisionRow = { id: string; at: string; by: RevisionBy; reason: RevisionReason; title: string; words: number; restoredFrom: string | null; who?: string | null }

// One word count everywhere (the editor footer uses the same function).
const countWords = (s: string) => countPostWords(s)
const same = (a?: string | null, b?: string | null) => (a ?? "").trim() === (b ?? "").trim()

async function row(userId: string, draftId: string) {
  return db.mockActivity.findFirst({ where: { id: draftId, userId, type: "post_draft" } })
}

function shape(r: NonNullable<Awaited<ReturnType<typeof row>>>): SavedDraft {
  const m = (r.metadata ?? {}) as DraftMeta
  return {
    id: r.id,
    title: m.title ?? "New post",
    markdown: m.markdown ?? "",
    excerpt: m.excerpt ?? null,
    status: m.status ?? "ready",
    url: m.url ?? null,
    scheduledFor: m.status === "scheduled" ? m.scheduledFor ?? null : null,
    rev: m.rev ?? 0,
    editedAt: m.editedAt ?? null,
    editedBy: m.editedBy ?? null,
    createdAt: r.createdAt.toISOString(),
    image: m.imageId ? imageUrl(m.imageId) : null,
  }
}

export async function getDraft(userId: string, draftId: string): Promise<SavedDraft | null> {
  const r = await row(userId, draftId)
  return r ? shape(r) : null
}

async function latestRevision(userId: string, draftId: string) {
  return db.mockActivity.findFirst({ where: { userId, type: REVISION_TYPE, metadata: { path: ["draftId"], equals: draftId } }, orderBy: { createdAt: "desc" } })
}

async function addRevision(userId: string, draftId: string, m: Omit<RevMeta, "draftId" | "words">, at?: Date) {
  // Teams: who saved it (lib/activity.ts auditActor; null on single-owner brands and in crons).
  const actor = m.by === "agent" || m.reason === "original" ? null : await auditActor(userId).catch(() => null)
  return db.mockActivity.create({
    data: {
      userId,
      type: REVISION_TYPE,
      title: `Saved a version of “${(m.title ?? "a post").slice(0, 80)}”`,
      metadata: { draftId, ...m, words: countWords(m.markdown), ...(actor ? { actor } : {}) },
      ...(at ? { createdAt: at } : {}),
    },
  })
}

/** The agent's original text becomes revision #1 before anything replaces it. */
async function ensureOriginal(userId: string, r: NonNullable<Awaited<ReturnType<typeof row>>>) {
  const any = await latestRevision(userId, r.id)
  if (any) return
  const m = (r.metadata ?? {}) as DraftMeta
  if (!(m.markdown ?? "").trim()) return
  await addRevision(userId, r.id, { markdown: m.markdown!, title: m.title, by: m.editedBy ?? "agent", reason: "original" }, m.editedAt ? undefined : r.createdAt)
}

export type SaveResult =
  | { ok: true; draft: SavedDraft; revisionId: string | null; /** A checkpoint was asked for but the text matched the newest version, so nothing new was kept. */ nothingNew?: boolean }
  | { ok: false; status: number; error: string; current?: SavedDraft }

/**
 * Save text into the draft. `baseRev` (the rev the editor loaded) guards against a second tab
 * overwriting newer text; `checkpoint` also records a revision (deduped against the latest one).
 */
export async function saveDraftText(
  userId: string,
  draftId: string,
  input: { markdown: string; title?: string; by: RevisionBy; checkpoint?: RevisionReason; baseRev?: number; restoredFrom?: string; allowPublished?: boolean },
): Promise<SaveResult> {
  const r = await row(userId, draftId)
  if (!r) return { ok: false, status: 404, error: "That draft isn’t here any more." }
  const m = (r.metadata ?? {}) as DraftMeta
  const markdown = input.markdown.replace(/\r\n?/g, "\n")
  if (markdown.length > MAX_DRAFT_CHARS) return { ok: false, status: 413, error: `That’s longer than ${MAX_DRAFT_CHARS.toLocaleString("en-US")} characters. Trim it a little.` }
  const title = input.title?.trim().slice(0, 200) || m.title || "New post"
  if (m.status === "published" && !input.allowPublished) return { ok: false, status: 409, error: "It’s already live, so this copy is locked. Changes here wouldn’t reach your site.", current: shape(r) }
  const changed = !same(markdown, m.markdown) || title !== (m.title ?? "New post")
  if (changed && input.baseRev != null && (m.rev ?? 0) !== input.baseRev) {
    return { ok: false, status: 409, error: "This draft changed somewhere else (another tab?). Load the newest version, then edit.", current: shape(r) }
  }
  if (changed || input.checkpoint) await ensureOriginal(userId, r)
  let updated = r
  if (changed) {
    updated = await db.mockActivity.update({
      where: { id: r.id },
      data: { metadata: { ...(r.metadata as object), markdown, title, rev: (m.rev ?? 0) + 1, editedAt: new Date().toISOString(), editedBy: input.by } },
    })
  }
  let revisionId: string | null = null
  let nothingNew = false
  if (input.checkpoint) {
    const last = await latestRevision(userId, r.id)
    const lm = last?.metadata as RevMeta | undefined
    // Same text + same reason as the newest version = nothing new to keep.
    if (last && lm && same(lm.markdown, markdown) && (lm.title ?? "") === title && (lm.reason === input.checkpoint || (input.checkpoint === "save" && lm.reason !== "publish"))) { revisionId = last.id; nothingNew = true }
    else revisionId = (await addRevision(userId, r.id, { markdown, title, by: input.by, reason: input.checkpoint, ...(input.restoredFrom ? { restoredFrom: input.restoredFrom } : {}) })).id
  }
  return { ok: true, draft: shape(updated), revisionId, ...(nothingNew ? { nothingNew } : {}) }
}

/** Newest first. */
export async function listRevisions(userId: string, draftId: string, take = 40): Promise<RevisionRow[]> {
  const rows = await db.mockActivity.findMany({
    where: { userId, type: REVISION_TYPE, metadata: { path: ["draftId"], equals: draftId } },
    orderBy: { createdAt: "desc" },
    take,
  })
  return rows.map((x) => {
    const m = x.metadata as RevMeta
    return { id: x.id, at: x.createdAt.toISOString(), by: m.by, reason: m.reason, title: m.title ?? "", words: countWords(m.markdown ?? ""), restoredFrom: m.restoredFrom ?? null, who: m.actor?.role ? whoName(m.actor) : null }
  })
}

export async function getRevision(userId: string, draftId: string, revId: string): Promise<(RevisionRow & { markdown: string }) | null> {
  const x = await db.mockActivity.findFirst({ where: { id: revId, userId, type: REVISION_TYPE } })
  const m = x?.metadata as RevMeta | undefined
  if (!x || !m || m.draftId !== draftId) return null
  return { id: x.id, at: x.createdAt.toISOString(), by: m.by, reason: m.reason, title: m.title ?? "", words: countWords(m.markdown ?? ""), restoredFrom: m.restoredFrom ?? null, markdown: m.markdown }
}

/** Restore = keep the current text as a version first (so a restore can itself be undone), then save the old one. */
export async function restoreRevision(userId: string, draftId: string, revId: string): Promise<SaveResult> {
  const rev = await getRevision(userId, draftId, revId)
  if (!rev) return { ok: false, status: 404, error: "That version isn’t here any more." }
  const cur = await getDraft(userId, draftId)
  if (!cur) return { ok: false, status: 404, error: "That draft isn’t here any more." }
  if (cur.status === "published") return { ok: false, status: 409, error: "It’s already live, so this copy is locked. Changes here wouldn’t reach your site.", current: cur }
  const keep = await saveDraftText(userId, draftId, { markdown: cur.markdown, title: cur.title, by: cur.editedBy ?? "owner", checkpoint: "save" })
  if (!keep.ok) return keep
  return saveDraftText(userId, draftId, { markdown: rev.markdown, title: rev.title || cur.title, by: "owner", checkpoint: "restore", restoredFrom: rev.id })
}

/**
 * Before publishing a draft: if the caller passes text that differs from what's saved (the chat's
 * inline edit, "Publish without them"), save it first, so the saved draft is exactly what goes out.
 * Returns the text and title to publish.
 */
export async function textToPublish(userId: string, draftId: string, text?: string | null, by: RevisionBy = "owner"): Promise<{ ok: true; markdown: string; title: string } | { ok: false; error: string }> {
  const d = await getDraft(userId, draftId)
  if (!d) return { ok: false, error: "That post isn’t here any more." }
  if (text?.trim() && !same(text, d.markdown) && d.status !== "published") {
    const s = await saveDraftText(userId, draftId, { markdown: text, by })
    if (!s.ok) return { ok: false, error: s.error }
    return { ok: true, markdown: s.draft.markdown, title: s.draft.title }
  }
  return { ok: true, markdown: d.markdown, title: d.title }
}

/** After a successful publish: keep the published text as a version ("Published"). */
export async function markPublished(userId: string, draftId: string, by: RevisionBy): Promise<void> {
  const d = await getDraft(userId, draftId)
  if (!d) return
  await saveDraftText(userId, draftId, { markdown: d.markdown, title: d.title, by, checkpoint: "publish", allowPublished: true })
}

/** For an AI rewrite of a saved draft: save the new text as the agent's version. */
export function saveAiRewrite(userId: string, draftId: string, markdown: string, title?: string): Promise<SaveResult> {
  return saveDraftText(userId, draftId, { markdown, title, by: "agent", checkpoint: "ai_rewrite" })
}
