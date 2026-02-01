import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { humanizeText } from "@/lib/claude"
import { clampTier, estimateCostUsd, monthStart, TIER_LIMITS, wordCount } from "@/lib/auth"
import { humanizeSemaphore, retry } from "@/lib/stability"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEmail(userId: string, email?: string | null) {
  return email && email.includes("@") ? email : `${userId}@no-email.local`
}

export async function POST(req: NextRequest) {
  await humanizeSemaphore.acquire()
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const text = body?.text

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Invalid input text", code: "INVALID_INPUT" }, { status: 400 })
    }

    const wc = wordCount(text)
    if (wc < 50) {
      return NextResponse.json({ success: false, error: "Text must be at least 50 words", code: "TEXT_TOO_SHORT" }, { status: 400 })
    }
    if (wc > 10000) {
      return NextResponse.json({ success: false, error: "Text must not exceed 10,000 words", code: "TEXT_TOO_LONG" }, { status: 400 })
    }

    const userId = session.user.id
    const email = safeEmail(userId, session.user.email)

    // ✅ DB عملیات را با retry انجام بده (پایداری روی connection hiccup / pgBouncer)
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

    const start = monthStart(new Date())
    const used = await retry(async () => {
      const agg = await prisma.usage.aggregate({
        where: { userId: user.id, createdAt: { gte: start } },
        _sum: { wordsProcessed: true },
      })
      return agg._sum.wordsProcessed ?? 0
    }, { attempts: 3, baseDelayMs: 250, maxDelayMs: 3000 })

    if (used + wc > limit) {
      return NextResponse.json({
        success: false,
        error: "Monthly limit exceeded. Upgrade to process more words.",
        code: "LIMIT_EXCEEDED",
        wordsUsed: used,
        wordsLimit: limit,
      }, { status: 429 })
    }

    // ✅ Claude (خودش retry+timeout دارد)
    const humanized = await humanizeText(text)

    // ✅ Decimal-safe
    const costRaw: any = estimateCostUsd(wc)
    const cost = new Prisma.Decimal(typeof costRaw === "number" ? costRaw : String(costRaw))

    await retry(async () => {
      await prisma.$transaction([
        prisma.usage.create({ data: { userId: user.id, wordsProcessed: wc, cost } }),
        prisma.text.create({ data: { userId: user.id, originalText: text, humanizedText: humanized, wordCount: wc } }),
      ])
    }, { attempts: 4, baseDelayMs: 300, maxDelayMs: 5000 })

    return NextResponse.json({
      success: true,
      humanizedText: humanized,
      wordCount: wc,
      wordsRemaining: Math.max(0, limit - (used + wc)),
      cost: Number(cost),
    })
  } catch (e) {
    console.error("Humanize API Error:", e)
    return NextResponse.json({ success: false, error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  } finally {
    humanizeSemaphore.release()
  }
}
