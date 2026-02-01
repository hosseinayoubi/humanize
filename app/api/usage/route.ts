import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"
import { clampTier, monthStart, nextMonthStart, TIER_LIMITS } from "@/lib/auth"
import { retry } from "@/lib/stability"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEmail(userId: string, email?: string | null) {
  // ✅ هیچ وقت unknown@example.com نذار (unique می‌ترکونه)
  return email && email.includes("@") ? email : `${userId}@no-email.local`
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      )
    }

    const userId = session.user.id
    const email = safeEmail(userId, session.user.email)

    const user = await retry(async () => {
      let u = await prisma.user.findUnique({ where: { id: userId } })
      if (!u) {
        u = await prisma.user.create({ data: { id: userId, email, tier: "free" } })
      } else if (u.email !== email) {
        u = await prisma.user.update({ where: { id: userId }, data: { email } })
      }
      return u
    }, { attempts: 4, baseDelayMs: 300, maxDelayMs: 4000 })

    const tier = clampTier(user.tier)
    const limit = TIER_LIMITS[tier]

    const used = await retry(async () => {
      const start = monthStart(new Date())
      const agg = await prisma.usage.aggregate({
        where: { userId: user.id, createdAt: { gte: start } },
        _sum: { wordsProcessed: true },
      })
      return agg._sum.wordsProcessed ?? 0
    }, { attempts: 3, baseDelayMs: 250, maxDelayMs: 3000 })

    const remaining = Math.max(0, limit - used)
    const pct = limit > 0 ? Math.round((used / limit) * 100) : 0

    return NextResponse.json(
      {
        success: true,
        tier,
        wordsUsed: used,
        wordsLimit: limit,
        wordsRemaining: remaining,
        percentageUsed: pct,
        resets: nextMonthStart(new Date()).toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Usage API Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load usage.", code: "SERVER_ERROR" },
      { status: 500 },
    )
  }
}
