// The owner's Canva connection: one MockActivity "canva_account" row per brand. Tokens are
// encrypted (AES-256-GCM, same key as the social accounts) and never logged.
import { db } from "@/lib/db"

const TYPE = "canva_account"

export type CanvaAccount = {
  id: string
  tokenEnc: string
  refreshEnc: string | null
  expiresAt: string | null
  scope: string
  connectedAt: string
  status?: "active" | "expired"
  name?: string | null
  /** The account can see brand templates (Canva Pro / Teams / Enterprise). */
  templates?: boolean
  /** The last design I opened in Canva for the owner to edit, so "Bring it back" knows which. */
  editing?: { designId: string; editUrl: string; title: string; at: string; postId?: string | null } | null
}

export async function getCanvaAccount(userId: string): Promise<CanvaAccount | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: TYPE }, orderBy: { createdAt: "desc" } })
  return r ? { ...(r.metadata as Omit<CanvaAccount, "id">), id: r.id } : null
}

export async function saveCanvaAccount(userId: string, patch: Partial<Omit<CanvaAccount, "id">>): Promise<CanvaAccount> {
  const cur = await getCanvaAccount(userId)
  const { id: _id, ...base } = cur ?? ({ id: "", tokenEnc: "", refreshEnc: null, expiresAt: null, scope: "", connectedAt: new Date().toISOString() } as CanvaAccount)
  void _id
  const next = { ...base, status: "active" as const, ...patch }
  if (cur) {
    await db.mockActivity.update({ where: { id: cur.id }, data: { metadata: next as object } })
    return { ...next, id: cur.id }
  }
  const row = await db.mockActivity.create({ data: { userId, type: TYPE, title: "Connected Canva", metadata: next as object } })
  return { ...next, id: row.id }
}

export async function removeCanvaAccount(userId: string): Promise<void> {
  await db.mockActivity.deleteMany({ where: { userId, type: TYPE } })
}
