import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getTopKeywords } from '@/lib/gsc'
import { getAnalyticsSnapshot } from '@/lib/ga'
import { getReviews } from '@/lib/gmb'
import { logActivity } from '@/lib/activity'
import { sendReconnectEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// True when a Google API error means the OAuth grant itself is dead (revoked
// refresh token, changed password, etc.) rather than a transient failure.
function isGoogleAuthError(err: unknown): boolean {
  const status =
    (err as { status?: number; code?: number; response?: { status?: number } })
      ?.status ??
    (err as { code?: number })?.code ??
    (err as { response?: { status?: number } })?.response?.status
  if (status === 401) return true
  const message = err instanceof Error ? err.message : String(err)
  return /invalid_grant|unauthorized|unauthenticated|\b401\b/i.test(message)
}

// Google revoked our access — surface it instead of dying silently.
// Always visible in server logs; activity row + reconnect email are
// deduplicated via the activity ledger (no new "integration_error" row is
// written if one already exists in the last 72 hours, so a broken account
// gets nudged at most once every 3 days until reconnected).
async function handleAuthFailure(userId: string): Promise<void> {
  try {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000)
    const recent = await db.mockActivity.findFirst({
      where: {
        userId,
        type: 'integration_error',
        createdAt: { gte: seventyTwoHoursAgo },
      },
      select: { id: true },
    })
    if (recent) return

    await logActivity(
      userId,
      'integration_error',
      'alphaa lost access to your Google account',
      'Reconnect in one click to keep autopilot running',
    )

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, businessName: true },
    })
    if (user?.email) {
      await sendReconnectEmail(user.email, {
        businessName: user.businessName || 'your business',
      })
    }
  } catch (err) {
    console.error(`[Sync] Failed to handle auth failure for ${userId}:`, err)
  }
}

async function resolveUserId(request: NextRequest): Promise<string | null> {
  // Allow internal calls from save-properties (fire-and-forget) via header
  const internalUserId = request.headers.get('x-internal-user-id')
  if (internalUserId) {
    return internalUserId
  }

  // Normal Clerk-authenticated call
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integration = await db.integration.findUnique({
      where: { userId },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Google not connected' },
        { status: 400 },
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let keywordCount = 0
    let reviewCount = 0
    let authFailure = false

    // --- GSC: keyword rankings ---
    if (integration.gscSiteUrl) {
      try {
        const keywords = await getTopKeywords(
          {
            accessToken: integration.accessToken,
            refreshToken: integration.refreshToken,
            expiresAt: integration.expiresAt,
            gscSiteUrl: integration.gscSiteUrl,
          },
          28,
        )

        // Upsert today's rankings: delete existing rows for today then insert fresh
        await db.keywordRanking.deleteMany({
          where: { userId, date: today },
        })

        if (keywords.length > 0) {
          await db.keywordRanking.createMany({
            data: keywords.map((kw) => ({
              userId,
              query: kw.query,
              clicks: kw.clicks,
              impressions: kw.impressions,
              ctr: kw.ctr,
              position: kw.position,
              date: today,
            })),
          })
          keywordCount = keywords.length

          // Milestone: only the FIRST successful keyword sync gets a feed
          // entry — routine daily refreshes would just be noise.
          const priorSync = await db.mockActivity.findFirst({
            where: { userId, type: 'keywords_synced' },
            select: { id: true },
          })
          if (!priorSync) {
            await logActivity(
              userId,
              'keywords_synced',
              'alphaa is now tracking your Google rankings',
              `${keywordCount} search terms monitored daily`,
            )
          }
        }
      } catch (err) {
        console.error('[Sync] GSC keyword fetch error:', err)
        if (isGoogleAuthError(err)) authFailure = true
      }
    }

    // --- GA4: analytics snapshot ---
    if (integration.gaPropertyId) {
      try {
        const snapshot = await getAnalyticsSnapshot(
          {
            accessToken: integration.accessToken,
            refreshToken: integration.refreshToken,
            expiresAt: integration.expiresAt,
            gaPropertyId: integration.gaPropertyId,
          },
          28,
        )

        // Upsert today's snapshot (one per day)
        const existingSnapshot = await db.analyticsSnapshot.findFirst({
          where: { userId, date: today },
        })

        const topPagesJson = snapshot.topPages as unknown as Prisma.InputJsonValue
        const trafficSourcesJson =
          snapshot.trafficSources as unknown as Prisma.InputJsonValue

        if (existingSnapshot) {
          await db.analyticsSnapshot.update({
            where: { id: existingSnapshot.id },
            data: {
              sessions: snapshot.sessions,
              pageViews: snapshot.pageViews,
              bounceRate: snapshot.bounceRate,
              avgSessionDuration: snapshot.avgSessionDuration,
              organicSessions: snapshot.organicSessions,
              topPages: topPagesJson,
              trafficSources: trafficSourcesJson,
            },
          })
        } else {
          await db.analyticsSnapshot.create({
            data: {
              userId,
              sessions: snapshot.sessions,
              pageViews: snapshot.pageViews,
              bounceRate: snapshot.bounceRate,
              avgSessionDuration: snapshot.avgSessionDuration,
              organicSessions: snapshot.organicSessions,
              topPages: topPagesJson,
              trafficSources: trafficSourcesJson,
              date: today,
            },
          })
        }
      } catch (err) {
        console.error('[Sync] GA snapshot fetch error:', err)
        if (isGoogleAuthError(err)) authFailure = true
      }
    }

    // --- GMB: reviews ---
    if (integration.gmbAccountId && integration.gmbLocationId) {
      try {
        // Compare total review count before/after the upserts to detect
        // genuinely NEW reviews (upserts that were creates, not updates).
        const reviewsBefore = await db.gmbReview.count({ where: { userId } })

        const reviews = await getReviews({
          accessToken: integration.accessToken,
          refreshToken: integration.refreshToken,
          expiresAt: integration.expiresAt,
          gmbAccountId: integration.gmbAccountId,
          gmbLocationId: integration.gmbLocationId,
        })

        for (const review of reviews) {
          await db.gmbReview.upsert({
            where: { userId_reviewId: { userId, reviewId: review.reviewId } },
            create: {
              userId,
              reviewId: review.reviewId,
              authorName: review.authorName,
              rating: review.rating,
              comment: review.comment,
              reply: review.reply,
              publishedAt: review.publishedAt,
            },
            update: {
              authorName: review.authorName,
              rating: review.rating,
              comment: review.comment,
              reply: review.reply,
              publishedAt: review.publishedAt,
            },
          })
        }
        reviewCount = reviews.length

        const reviewsAfter = await db.gmbReview.count({ where: { userId } })
        const newReviews = reviewsAfter - reviewsBefore
        if (newReviews > 0) {
          await logActivity(
            userId,
            'reviews',
            `${newReviews} new review${newReviews === 1 ? '' : 's'} on your Google profile`,
            'alphaa is keeping an eye on your reputation',
          )
        }
      } catch (err) {
        console.error('[Sync] GMB reviews fetch error:', err)
        if (isGoogleAuthError(err)) authFailure = true
      }
    }

    // If any Google call failed because the OAuth grant is dead, tell the
    // user instead of failing silently forever.
    if (authFailure) {
      await handleAuthFailure(userId)
    }

    // Update lastSyncedAt on the integration record
    await db.integration.update({
      where: { userId },
      data: { lastSyncedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      synced: { keywords: keywordCount, reviews: reviewCount },
    })
  } catch (err) {
    console.error('[Sync] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Sync failed unexpectedly' },
      { status: 500 },
    )
  }
}
