import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { humanizeText } from "@/lib/claude"
import { retry, humanizeSemaphore, withTimeout } from "@/lib/stability"
import { Decimal } from "@prisma/client/runtime/library"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// ✅ یوزر همیشگی (بدون محدودیت)
const UNLIMITED_EMAIL = "mc.hossein@gmail.com"

const LIMITS = {
  free: { daily: 2000, perRequest: 500 },
  basic: { daily: 10000, perRequest: 2000 },
  pro: { daily: 50000, perRequest: 5000 },
  unlimited: { daily: Infinity, perRequest: Infinity },
} as const

function safeEmail(userId: string, email?: string | null) {
  return email && email.includes("@") ? email : `${userId}@no-email.local`
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getCost(wordCount: number, tier: keyof typeof LIMITS): number {
  if (tier === "unlimited") return 0
  const base = wordCount * 0.001
  if (tier === "pro") return base * 0.8
  if (tier === "basic") return base * 0.9
  return base
}

async function getDailyUsage(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const agg = await retry(async () => {
    return await prisma.usage.aggregate({
      where: { userId, createdAt: { gte: today } },
      _sum: { wordsProcessed: true },
    })
  }, { tag: "getDailyUsage" })
  return agg._sum?.wordsProcessed || 0
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => null)
    const text = body?.text

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const userId = session.user.id
    const realEmail = (session.user.email || "").toLowerCase()
    const email = safeEmail(userId, realEmail)

    const wordCount = countWords(text)

    // ✅ sync user (ایمن + یوزر همیشگی)
    let dbUser = await retry(async () => {
      let u = await prisma.user.findUnique({ where: { id: userId } })

      const desiredTier = realEmail === UNLIMITED_EMAIL ? "unlimited" : "free"

      if (!u) {
        u = await prisma.user.create({
          data: { id: userId, email, tier: desiredTier },
        })
      } else {
        const nextTier =
          realEmail === UNLIMITED_EMAIL ? "unlimited" : (u.tier as string)

        u = await prisma.user.update({
          where: { id: userId },
          data: { email, tier: nextTier },
        })
      }

      return u
    }, { attempts: 4, baseDelayMs: 300, maxDelayMs: 4000, tag: "syncUser" })

    const tier = (dbUser.tier as keyof typeof LIMITS) || "free"
    const limit = LIMITS[tier] || LIMITS.free

    if (wordCount > limit.perRequest) {
      return NextResponse.json({ error: `Max ${limit.perRequest} words per request for ${tier} tier` }, { status: 400 })
    }

    const dailyUsed = await getDailyUsage(userId)
    if (dailyUsed + wordCount > limit.daily) {
      return NextResponse.json({ error: `Daily limit (${limit.daily} words) exceeded.` }, { status: 400 })
    }

    await humanizeSemaphore.acquire()

    let humanized: string
    try {
      humanized = await withTimeout(humanizeText(text), 35000)
    } finally {
      humanizeSemaphore.release()
    }

    const cost = getCost(wordCount, tier)

    await retry(async () => {
      await prisma.usage.create({
        data: {
          userId,
          wordsProcessed: wordCount,
          cost: new Decimal(cost.toFixed(4)),
        },
      })
    }, { tag: "createUsage" })

    await retry(async () => {
      await prisma.text.create({
        data: { userId, originalText: text, humanizedText: humanized, wordCount },
      })
    }, { tag: "createText" })

    return NextResponse.json({ success: true, humanizedText: humanized })
  } catch (error: any) {
    console.error("[POST /api/humanize] Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    )
  }
}
