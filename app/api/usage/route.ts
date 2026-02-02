import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"
import { clampTier, monthStart, nextMonthStart, TIER_LIMITS } from "@/lib/auth"
import { retry } from "@/lib/stability"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEmail(userId: string, email?: string | null) {
  // هیچ وقت unknown@example.com نذار (Unique می‌ترکونه)
  return email && email.includes("@") ? email.toLowerCase() : `${userId}@no-email.local`
}

async function ensureUser(userId: string, email: string) {
  return await retry(async () => {
    // 1) اول با id
    let u = await prisma.user.findUnique({ where: { id: userId } })
    if (u) {
      if (u.email !== email) {
        // ممکنه ایمیل عوض شده باشه
        u = await prisma.user.update({ where: { id: userId }, data: { email } })
      }
      return u
    }

    // 2) تلاش برای create
    try {
      return await prisma.user.create({ data: { id: userId, email, tier: "free" } })
    } catch (e: any) {
      // 3) اگر email قبلاً وجود داشت => id کاربر قدیمی رو به id جدید تغییر بده
      if (e?.code === "P2002") {
        await prisma.$transaction(async (tx) => {
          // اگر رکوردی با این email هست، id اش رو با id جدید جایگزین کن
          // FKها در migration ON UPDATE CASCADE هستند، پس usage/text هم درست می‌ماند
          await tx.$executeRaw`
            UPDATE "users"
            SET "id" = ${userId}
            WHERE "email" = ${email}
          `
        })

        // بعد از update دوباره بخون
        const fixed = await prisma.user.findUnique({ where: { id: userId } })
        if (fixed) return fixed
      }
      throw e
    }
  }, { attempts: 4, baseDelayMs: 300, maxDelayMs: 4000, tag: "ensureUser" })
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
    }, { attempts: 3, baseDelayMs: 250, maxDelayMs: 3000, tag: "usageAgg" })

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
    console.error("[GET /api/usage] ERROR:", error)
    return NextResponse.json(
      { success: false, error: "Usage failed." },
      { status: 500 },
    )
  }
}
