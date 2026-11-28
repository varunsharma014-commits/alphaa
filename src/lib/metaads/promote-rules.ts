// Pure request builders for "Promote this post" on Facebook & Instagram (no database, no
// network): tested in scripts/test-ad-features.ts. The calls themselves are in promote.ts.
import { targetingFor, toMinor, type GeoCity, type SpecialCategory } from "./graph"

export type PromoSpec = {
  adAccountId: string
  currency: string
  name: string
  special: SpecialCategory
  country: string | null
  dailyBudget: number
  pageId: string
  city: GeoCity | null
  radiusMiles: number
  from: "facebook" | "instagram"
  /** Facebook "<pageId>_<postId>" or the Instagram media id. */
  postId: string
  igUserId?: string | null
}

export const PROMO_DAYS = [3, 7, 14] as const

/** Pure: the four create calls (campaign, ad set, creative, ad), every one PAUSED. */
export function promoRequests(s: PromoSpec) {
  const special = s.special !== "NONE"
  return {
    campaign: {
      name: s.name.slice(0, 200), objective: "OUTCOME_ENGAGEMENT", status: "PAUSED", buying_type: "AUCTION",
      special_ad_categories: special ? [s.special] : [], ...(special && s.country ? { special_ad_category_country: [s.country] } : {}),
      is_adset_budget_sharing_enabled: false,
    },
    adSet: (campaignId: string) => ({
      name: `${s.name} · nearby`.slice(0, 200), campaign_id: campaignId, daily_budget: String(toMinor(s.dailyBudget, s.currency)),
      billing_event: "IMPRESSIONS", bid_strategy: "LOWEST_COST_WITHOUT_CAP", optimization_goal: "POST_ENGAGEMENT", destination_type: "ON_POST",
      targeting: targetingFor(s), status: "PAUSED",
    }),
    creative: s.from === "facebook"
      ? { name: `${s.name} · post`.slice(0, 100), object_story_id: s.postId }
      : { name: `${s.name} · post`.slice(0, 100), object_id: s.pageId, instagram_user_id: s.igUserId, source_instagram_media_id: s.postId },
    ad: (adSetId: string, creativeId: string) => ({ name: `${s.name} · ad`.slice(0, 100), adset_id: adSetId, creative: { creative_id: creativeId }, status: "PAUSED" }),
  }
}

/** Pure: is this post one the picked Page / Instagram account can promote? Null = yes, else why not. */
export function promoBlocker(o: { from: "facebook" | "instagram"; externalId: string; pageId?: string | null; igUserId?: string | null; accountExternalId: string }): string | null {
  if (!o.pageId) return "Pick the Facebook Page your ads run from first."
  if (o.from === "facebook") {
    if (!/^\d+_\d+$/.test(o.externalId)) return "Meta didn’t give me this post’s full id, so I can’t promote it. Pick another post."
    if (o.externalId.split("_")[0] !== o.pageId) return "This post is on a different Page than the one your ads use."
    return null
  }
  if (!o.igUserId) return "Pick the Instagram account your ads use first."
  if (o.accountExternalId !== o.igUserId) return "This post is on a different Instagram account than the one your ads use."
  if (!/^\d+$/.test(o.externalId)) return "Meta didn’t give me this post’s id, so I can’t promote it."
  return null
}

