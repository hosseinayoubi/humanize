import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"
import { clampTier, monthStart, nextMonthStart, TIER_LIMITS } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEmail(userId: string, email?: string | null) {
  return email && email.includes("@") ? email : `${userId}@no-email.local`
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session)
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      )

    const userId = session.user.id
    const email = safeEmail(userId, session.user.email)

    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      user = await prisma.user.create({ data: { id: userId, email, tier: "free" } })
    } else if (user.email !== email) {
      user = await prisma.user.update({ where: { id: userId }, data: { email } })
    }

    const tier = clampTier(user.tier)
    const limit = TIER_LIMITS[tier]

    const start = monthStart(new Date())
    const agg = await prisma.usage.aggregate({
      where: { userId: user.id, createdAt: { gte: start } },
      _sum: { wordsProcessed: true },
    })

    const used = agg._sum.wordsProcessed ?? 0
    const remaining = Math.max(0, limit - used)
    const pct = Math.round((used / limit) * 100)

    return NextResponse.json({
      success: true,
      tier,
      wordsUsed: used,
      wordsLimit: limit,
      wordsRemaining: remaining,
      percentageUsed: pct,
      resets: nextMonthStart(new Date()).toISOString(),
    })
  } catch (error) {
    console.error("Usage API Error:", error)
    return NextResponse.json(
      { success: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 },
    )
  }
}
