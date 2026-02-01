import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { humanizeText } from "@/lib/claude"
import { retry, humanizeSemaphore, withTimeout } from "@/lib/stability"
import { Decimal } from "@prisma/client/runtime/library"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEmail(userId: string, email?: string | null) {
  return email && email.includes("@") ? email : `${userId}@no-email.local`
}

// محدودیت‌ها (اگه از auth.ts استفاده می‌کنی، می‌تونی این بخش رو بعداً unify کنی)
const LIMITS = {
  free: { daily: 2000, perRequest: 500 },
  basic: { daily: 10000, perRequest: 2000 },
  pro: { daily: 50000, perRequest: 5000 },
  unlimited: { daily: Infinity, perRequest: Infinity },
} as const

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

async function getDailyUsage(userId: string) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const agg = await prisma.usage.aggregate({
    where: { userId, createdAt: { gte: start } },
    _sum: { wordsProcessed: true },
  })
  return agg._sum.wordsProcessed ?? 0
}

function getCost(words: number, tier: keyof typeof LIMITS) {
  // قیمت نمونه — هر چی خواستی اینجا تنظیم کن
  const base = (words / 1000) * 1.2
  return base
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const text = body?.text

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Invalid input text" }, { status: 400 })
    }

    const userId = session.user.id
    const userEmail = safeEmail(userId, session.user.email)

    // ✅ sync user (بدون ایمیل تکراری)
    let dbUser = await retry(
      async () => {
        let u = await prisma.user.findUnique({ where: { id: userId } })
        if (!u) {
          u = await prisma.user.create({ data: { id: userId, email: userEmail, tier: "free" } })
        } else if (u.email !== userEmail) {
          u = await prisma.user.update({ where: { id: userId }, data: { email: userEmail } })
        }
        return u
      },
      { attempts: 4, baseDelayMs: 300, maxDelayMs: 4000, tag: "syncUser" },
    )

    const tier = (dbUser.tier as keyof typeof LIMITS) || "free"
    const limit = LIMITS[tier] || LIMITS.free

    const wordCount = countWords(text)

    if (wordCount > limit.perRequest) {
      return NextResponse.json(
        { success: false, error: `Max ${limit.perRequest} words per request for ${tier} tier` },
        { status: 400 },
      )
    }

    const dailyUsed = await getDailyUsage(userId)
    if (dailyUsed + wordCount > limit.daily) {
      return NextResponse.json(
        { success: false, error: `Daily limit (${limit.daily} words) exceeded. Upgrade your tier.` },
        { status: 400 },
      )
    }

    await humanizeSemaphore.acquire()

    let humanized: string
    try {
      humanized = await withTimeout(humanizeText(text), 35000)
    } catch (e: any) {
      const msg = e?.message || String(e)
      console.error("Humanize error:", msg)
      return NextResponse.json(
        { success: false, error: "Failed to humanize text. Please try again." },
        { status: 500 },
      )
    } finally {
      humanizeSemaphore.release()
    }

    // ذخیره Usage + Text
    const cost = getCost(wordCount, tier)

    await retry(
      async () => {
        await prisma.usage.create({
          data: {
            userId,
            wordsProcessed: wordCount,
            cost: new Decimal(cost.toFixed(4)),
          },
        })
      },
      { tag: "createUsage" },
    )

    await retry(
      async () => {
        await prisma.text.create({
          data: {
            userId,
            originalText: text,
            humanizedText: humanized,
            wordCount,
          },
        })
      },
      { tag: "createText" },
    )

    return NextResponse.json({ success: true, humanizedText: humanized })
  } catch (error: any) {
    console.error("[POST /api/humanize] Unexpected error:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    )
  }
}
