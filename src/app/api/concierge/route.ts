export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

// The "do it for me" human services (Full Service plan, $149 setup) were retired from sale on
// 2026-11-18, so the intake is closed. Kept as a route so old clients get a clear answer.
export async function POST() {
  return NextResponse.json({ error: "That service is no longer offered. Email hi@alphaa.app and we'll help." }, { status: 410 })
}
