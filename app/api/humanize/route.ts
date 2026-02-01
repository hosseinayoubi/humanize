import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"
import { humanizeText } from "@/lib/claude"
import { clampTier, estimateCostUsd, monthStart, TIER_LIMITS, wordCount } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => null)
    const text = body?.text

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid input text", code: "INVALID_INPUT" },
        { status: 400 },
      )
    }

    const wc = wordCount(text)
    if (wc < 50)
      return NextResponse.json(
        { success: false, error: "Text must be at least 50 words", code: "TEXT_TOO_SHORT" },
        { status: 400 },
      )
    if (wc > 10000)
      return NextResponse.json(
        { success: false, error: "Text must not exceed 10,000 words", code: "TEXT_TOO_LONG" },
        { status: 400 },
      )

    // PgBouncer-friendly user creation (بدون upsert)
    const email = session.user.email ?? "unknown@example.com"
    const userId = session.user.id

    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      user = await prisma.user.create({
        data: { id: userId, email, tier: "free" },
      })
    } else if (user.email !== email) {
      user = await prisma.user.update({
        where: { id: userId },
        data: { email },
      })
    }

    const tier = clampTier(user.tier)
    const limit = TIER_LIMITS[tier]

    const start = monthStart(new Date())
    const agg = await prisma.usage.aggregate({
      where: { userId: user.id, createdAt: { gte: start } },
      _sum: { wordsProcessed: true },
    })
    const used = agg._sum.wordsProcessed ?? 0

    if (used + wc > limit) {
      return NextResponse.json(
        {
          success: false,
          error: "Monthly limit exceeded. Upgrade to process more words.",
          code: "LIMIT_EXCEEDED",
          wordsUsed: used,
          wordsLimit: limit,
        },
        { status: 429 },
      )
    }

    let humanized = ""
    try {
      humanized = await humanizeText(text)
    } catch (e: any) {
      const details = e?.message ? String(e.message) : String(e)
      console.error("Claude API error:", details)
      return NextResponse.json(
        { success: false, error: "Claude API request failed", code: "CLAUDE_API_ERROR", details },
        { status: 500 },
      )
    }

    const cost = estimateCostUsd(wc)

    await prisma.$transaction([
      prisma.usage.create({ data: { userId: user.id, wordsProcessed: wc, cost } }),
      prisma.text.create({ data: { userId: user.id, originalText: text, humanizedText: humanized, wordCount: wc } }),
    ])

    return NextResponse.json({
      success: true,
      humanizedText: humanized,
      wordCount: wc,
      wordsRemaining: Math.max(0, limit - (used + wc)),
      cost: Number(cost),
    })
  } catch (error) {
    console.error("Humanize API Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 },
    )
  }
}
