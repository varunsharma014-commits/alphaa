// Which public scans (ScanLead) belong to a brand.
// A scan linked by userId is always this brand's. A scan matched only by email must ALSO be for
// this brand's website: one owner runs several brands (lib/sites.ts) and runs free checks for all
// of them from the same email, so email alone pulled GIGABOOST scans into the alphaa.app brand
// (2026-11-18: "What's working" proposed GIGABOOST posts for Alphaa).
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

export const siteHost = (url: string | null | undefined): string | null => {
  const h = (url ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]
  return h && h.includes(".") ? h : null
}

export async function ownScanWhere(user: { id: string; email?: string | null; websiteUrl?: string | null }): Promise<Prisma.ScanLeadWhereInput> {
  const site = user.websiteUrl !== undefined ? user.websiteUrl : (await db.user.findUnique({ where: { id: user.id }, select: { websiteUrl: true } }))?.websiteUrl
  const host = siteHost(site)
  return {
    OR: [
      { userId: user.id },
      ...(user.email && host ? [{ email: { equals: user.email, mode: "insensitive" as const }, businessUrl: { contains: host, mode: "insensitive" as const } }] : []),
    ],
  }
}
