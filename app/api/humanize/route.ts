import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { humanizeText } from "@/lib/claude"
import { retry, humanizeSemaphore } from "@/lib/stability"

const TIER_LIMITS: Record<string, number> = {
  free: 5000,
  basic: 50000,
  pro: 500000,
}

export async function POST(req: NextRequest) {
  let semaphoreAcquired = false

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text } = await req.json()
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const wordCount = text.trim().split(/\s+/).length
    if (wordCount > 3000) {
      return NextResponse.json({ error: "Text too long (max 3000 words)" }, { status: 400 })
    }

    const user = await retry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, tier: true },
      }),
    )

    if (!user) {
      await retry(() =>
        prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email!,
            tier: "free",
          },
        }),
      )
    }

    const tier = user?.tier || "free"
    const limit = TIER_LIMITS[tier] || TIER_LIMITS.free

    const totalUsage = await retry(() =>
      prisma.usage.aggregate({
        where: { userId: session.user.id },
        _sum: { wordsProcessed: true },
      }),
    )

    const used = totalUsage._sum.wordsProcessed || 0
    if (used + wordCount > limit) {
      return NextResponse.json(
        {
          error: `Word limit exceeded. Your ${tier} plan allows ${limit} words/month. You've used ${used}.`,
        },
        { status: 403 },
      )
    }

    await humanizeSemaphore.acquire()
    semaphoreAcquired = true

    const humanized = await retry(
      () => humanizeText(text),
      { attempts: 3, baseDelayMs: 1000, tag: "humanizeText" },
    )

    const cost = (wordCount / 1000) * 0.003

    await retry(() =>
      prisma.$transaction([
        prisma.usage.create({
          data: {
            userId: session.user.id,
            wordsProcessed: wordCount,
            cost,
          },
        }),
        prisma.text.create({
          data: {
            userId: session.user.id,
            originalText: text,
            humanizedText: humanized,
            wordCount,
          },
        }),
      ]),
    )

    return NextResponse.json({
      original: text,
      humanized,
      wordCount,
      usage: { used: used + wordCount, limit },
    })
  } catch (err: any) {
    console.error("❌ HUMANIZE ERROR:", err)
    console.error("Error name:", err?.name)
    console.error("Error message:", err?.message)
    console.error("Error stack:", err?.stack)
    
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred" },
      { status: 500 }
    )
  } finally {
    if (semaphoreAcquired) {
      humanizeSemaphore.release()
    }
  }
}
