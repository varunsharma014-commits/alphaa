import { db } from "@/lib/db"

/** Paying or trialing customers (plus anyone in their first 14 days) — who the agent works for. */
export async function activeUsers() {
  return db.user.findMany({
    where: {
      onboardingCompleted: true,
      OR: [
        { subscriptionStatus: { in: ["active", "trialing"] } },
        { createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) } },
      ],
    },
    select: { id: true, plan: true, websiteUrl: true },
  })
}

export const authorized = (req: Request) => !!process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
