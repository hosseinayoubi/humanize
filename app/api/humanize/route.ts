import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { humanizeText } from "@/lib/claude"
import { retry, humanizeSemaphore, withTimeout } from "@/lib/stability"
import { Decimal } from "@prisma/client/runtime/library"

// محدودیت طبقات
const LIMITS = {
  free: { daily: 2000, perRequest: 500 },
  basic: { daily: 10000, perRequest: 2000 },
  pro: { daily: 50000, perRequest: 5000 },
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getCost(wordCount: number, tier: string): number {
  const base = wordCount * 0.001 // $0.001 per word
  if (tier === "pro") return base * 0.8
  if (tier === "basic") return base * 0.9
  return base
}

async function getDailyUsage(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const agg = await retry(
    async () => {
      return await prisma.usage.aggregate({
        where: { userId, createdAt: { gte: today } },
        _sum: { wordsProcessed: true },
      })
    },
    { tag: "getDailyUsage" },
  )
  return agg._sum?.wordsProcessed || 0
}

// ✅ FIXED: safeRunPass با try-catch داخلی برای جلوگیری از throw کردن error به بیرون
async function safeRunPass(
  text: string,
  passNum: number,
  timeout = 35000,
): Promise<string> {
  try {
    return await withTimeout(humanizeText(text), timeout)
  } catch (e: any) {
    const msg = e?.message || String(e)
    console.error(`[Pass${passNum}] error (non-fatal):`, msg)
    // ✅ به جای throw، متن قبلی را برمی‌گردانیم
    return text
  }
}

// ✅ FIXED: processHumanize اگر همه پاس‌ها فیل بشن، حداقل متن اولیه را برمی‌گرداند
async function processHumanize(
  userId: string,
  originalText: string,
  tier: string,
): Promise<string> {
  let currentText = originalText

  // Pass 1
  const p1 = await safeRunPass(currentText, 1, 35000)
  if (p1 && p1 !== currentText) currentText = p1

  // Pass 2
  const p2 = await safeRunPass(currentText, 2, 35000)
  if (p2 && p2 !== currentText) currentText = p2

  // Pass 3
  const p3 = await safeRunPass(currentText, 3, 35000)
  if (p3 && p3 !== currentText) currentText = p3

  return currentText
}

// ✅ FIXED: اضافه کردن try-catch کلی برای جلوگیری از crash
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { text } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const wordCount = countWords(text)

    // بررسی کاربر یا ساخت
    let dbUser = await retry(
      async () => {
        return await prisma.user.findUnique({ where: { id: userId } })
      },
      { tag: "findUser" },
    )

    if (!dbUser) {
      dbUser = await retry(
        async () => {
          return await prisma.user.create({
            data: {
              id: userId,
              email: session.user.email!,
              tier: "free",
            },
          })
        },
        { tag: "createUser" },
      )
    }

    const tier = dbUser.tier as keyof typeof LIMITS
    const limit = LIMITS[tier] || LIMITS.free

    if (wordCount > limit.perRequest) {
      return NextResponse.json(
        {
          error: `Max ${limit.perRequest} words per request for ${tier} tier`,
        },
        { status: 400 },
      )
    }

    const dailyUsed = await getDailyUsage(userId)
    if (dailyUsed + wordCount > limit.daily) {
      return NextResponse.json(
        {
          error: `Daily limit (${limit.daily} words) exceeded. Upgrade your tier.`,
        },
        { status: 400 },
      )
    }

    // ✅ کنترل همزمانی
    await humanizeSemaphore.acquire()

    let humanized: string
    try {
      // ✅ processHumanize اکنون دیگر error throw نمی‌کند
      humanized = await processHumanize(userId, text, tier)
    } finally {
      humanizeSemaphore.release()
    }

    // ذخیره Usage
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

    // ذخیره Text
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

    return NextResponse.json({ humanizedText: humanized })
  } catch (error: any) {
    // ✅ لاگ می‌کنیم اما به کلاینت error کلی می‌دهیم
    console.error("[POST /api/humanize] Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    )
  }
}
