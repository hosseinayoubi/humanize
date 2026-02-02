import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"
import { clampTier, monthStart, nextMonthStart, TIER_LIMITS } from "@/lib/auth"
import { retry } from "@/lib/stability"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEmail(userId: string, email?: string | null) {
  // همیشه یونیک بساز که به unique نخوره
  return email && email.includes("@") ? email.toLowerCase() : `${userId}@no-email.local`
}

async function ensureUser(userId: string, email: string) {
  return await retry(async () => {
    // 1) اول با id
    const byId = await prisma.user.findUnique({ where: { id: userId } })
    if (byId) {
      if (byId.email !== email) {
        return await prisma.user.update({ where: { id: userId }, data: { email } })
      }
      return byId
    }

    // 2) اگر با id نبود، با email بگرد (حل P2002)
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) {
      // اگر قبلاً کاربر با این ایمیل هست، همون رو برگردون
      return byEmail
    }

    // 3) اگر هیچکدوم نبود، create
    return await prisma.user.create({ data: { id: userId, email, tier: "free" } })
  }, { attempts: 4, baseDelayMs: 300, maxDelayMs: 4000 })
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

    const user = await ensureUser(userId, email)

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
    console.error("[GET /api/usage] ERROR:", error)
    return NextResponse.json(
      { success: false, error: "Usage failed." },
      { status: 500 },
    )
  }
}
