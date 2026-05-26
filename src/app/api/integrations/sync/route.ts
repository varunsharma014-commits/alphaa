import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getTopKeywords } from '@/lib/gsc'
import { getAnalyticsSnapshot } from '@/lib/ga'
import { getReviews } from '@/lib/gmb'

export const dynamic = 'force-dynamic'

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
        }
      } catch (err) {
        console.error('[Sync] GSC keyword fetch error:', err)
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
      }
    }

    // --- GMB: reviews ---
    if (integration.gmbAccountId && integration.gmbLocationId) {
      try {
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
      } catch (err) {
        console.error('[Sync] GMB reviews fetch error:', err)
      }
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
