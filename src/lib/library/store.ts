// Brand library rows: one MockActivity "brand_asset" per linked file (metadata = BrandAsset
// without the id), small previews as "asset_thumb" rows ({ b64, mime }, ≤ 400 px JPEG).
import { db } from "@/lib/db"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { ASSET_THUMB, BRAND_ASSET, MAX_ASSETS, type BrandAsset, type LibrarySettings } from "./types"

type Meta = Omit<BrandAsset, "id">

export async function listAssets(userId: string): Promise<BrandAsset[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: BRAND_ASSET }, orderBy: { createdAt: "asc" }, select: { id: true, metadata: true }, take: MAX_ASSETS + 20 })
  return rows.map((r) => ({ ...(r.metadata as Meta), id: r.id }))
}

export async function getAsset(userId: string, id: string): Promise<BrandAsset | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: BRAND_ASSET }, select: { id: true, metadata: true } })
  return r ? { ...(r.metadata as Meta), id: r.id } : null
}

/** For the signed public streaming route only (the signature already proves which row). */
export async function getAssetAnyUser(id: string): Promise<{ userId: string; asset: BrandAsset } | null> {
  const r = await db.mockActivity.findFirst({ where: { id, type: BRAND_ASSET }, select: { id: true, userId: true, metadata: true } })
  return r ? { userId: r.userId, asset: { ...(r.metadata as Meta), id: r.id } } : null
}

export async function createAsset(userId: string, a: Meta): Promise<BrandAsset> {
  const row = await db.mockActivity.create({ data: { userId, type: BRAND_ASSET, title: `Linked “${a.name.slice(0, 80)}” to your brand library`, metadata: a as object } })
  return { ...a, id: row.id }
}

export async function patchAsset(userId: string, id: string, patch: Partial<Meta>): Promise<BrandAsset | null> {
  const cur = await getAsset(userId, id)
  if (!cur) return null
  const { id: _id, ...rest } = { ...cur, ...patch }
  void _id
  await db.mockActivity.update({ where: { id }, data: { metadata: rest as object } })
  return { ...rest, id }
}

export async function removeAsset(userId: string, id: string): Promise<boolean> {
  const cur = await getAsset(userId, id)
  if (!cur) return false
  if (cur.thumbId) await db.mockActivity.deleteMany({ where: { id: cur.thumbId, userId, type: ASSET_THUMB } })
  const s = await librarySettings(userId)
  if (s.nextVideo === id) await saveLibrarySettings(userId, { nextVideo: null })
  return (await db.mockActivity.deleteMany({ where: { id, userId, type: BRAND_ASSET } })).count > 0
}

export async function storeThumb(userId: string, jpeg: Buffer, alt: string): Promise<string> {
  const row = await db.mockActivity.create({ data: { userId, type: ASSET_THUMB, title: `Preview of “${alt.slice(0, 80)}”`, metadata: { b64: jpeg.toString("base64"), mime: "image/jpeg" } } })
  return row.id
}

export async function thumbBytes(userId: string, id: string): Promise<Buffer | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: ASSET_THUMB }, select: { metadata: true } })
  const b64 = (r?.metadata as { b64?: string } | null)?.b64
  return b64 ? Buffer.from(b64, "base64") : null
}

export async function librarySettings(userId: string): Promise<LibrarySettings> {
  return (await getAgentSettings(userId)).library ?? {}
}
export async function saveLibrarySettings(userId: string, patch: Partial<LibrarySettings>): Promise<LibrarySettings> {
  const next = { ...(await librarySettings(userId)), ...patch }
  await saveAgentSettings(userId, { library: next })
  return next
}
