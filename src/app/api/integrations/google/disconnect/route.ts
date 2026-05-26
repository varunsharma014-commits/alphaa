import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await db.integration.deleteMany({ where: { userId: user.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Google Disconnect] Error:', err)
    return NextResponse.json(
      { error: 'Failed to disconnect Google integration' },
      { status: 500 },
    )
  }
}
