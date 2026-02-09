// app/api/humanize/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { humanizeText } from "@/lib/claude"
import { retry, humanizeSemaphore, withTimeout } from "@/lib/stability"
import { Decimal } from "@prisma/client/runtime/library"
import { clampTier, getTierConfig, monthStart, estimateCostUsd, wordCount, type Tier, APP_CONFIG } from "@/lib/config"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function ensureUser(userId: string, email: string | null) {
  // ✅ کم‌ریسک‌ترین: id همان Supabase id باقی می‌ماند
  return await retry(async () => {
    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (existing) {
      // ایمیل nullable است؛ اگر تغییر کرد آپدیت کن
      if ((existing.email ?? null) !== (email ?? null)) {
        return await prisma.user.update({
          where: { id: userId },
          data: { email: email ? email.toLowerCase() : null },
        })
      }
      return existing
    }

    return await prisma.user.create({
      data: {
        id: userId,
        email: email ? email.toLowerCase() : null,
        tier: "free",
      },
    })
  }, { attempts: 4, baseDelayMs: 300, maxDelayMs: 4000, tag: "ensureUser" })
}

async function getMonthlyUsage(userId: string) {
  const start = monthStart(new Date())
  const agg = await prisma.usage.aggregate({
    where: { userId, createdAt: { gte: start } },
    _sum: { wordsProcessed: true },
  })
  return agg._sum.wordsProcessed ?? 0
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const text = body?.text

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Invalid input text" }, { status: 400 })
    }

    const authUserId = session.user.id
    const email = session.user.email ?? null

    const dbUser = await ensureUser(authUserId, email)

    const tier = clampTier(dbUser.tier) as Tier
    const limit = getTierConfig(tier)

    const wc = wordCount(text)

    // per-request
    if (wc > limit.perRequestWords) {
      return NextResponse.json(
        { success: false, error: `Max ${limit.perRequestWords} words per request for ${tier} tier` },
        { status: 400 },
      )
    }

    // monthly
    const used = await getMonthlyUsage(dbUser.id)
    if (used + wc > limit.monthlyWords) {
      return NextResponse.json(
        { success: false, error: `Monthly limit (${limit.monthlyWords} words) exceeded. Upgrade your tier.` },
        { status: 400 },
      )
    }

    await humanizeSemaphore.acquire()

    let humanized: string
    try {
      humanized = await withTimeout(
        humanizeText(text, tier),
        APP_CONFIG.API.HUMANIZE_TIMEOUT_MS,
      )
    } finally {
      humanizeSemaphore.release()
    }

    const cost = estimateCostUsd(wc)

    await retry(async () => {
      await prisma.usage.create({
        data: {
          userId: dbUser.id,
          wordsProcessed: wc,
          cost: new Decimal(cost.toFixed(4)),
        },
      })
    }, { tag: "createUsage" })

    await retry(async () => {
      await prisma.text.create({
        data: {
          userId: dbUser.id,
          originalText: text,
          humanizedText: humanized,
          wordCount: wc,
        },
      })
    }, { tag: "createText" })

    return NextResponse.json({ success: true, humanizedText: humanized })
  } catch (error: any) {
    console.error("[POST /api/humanize] Unexpected error:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    )
  }
}
