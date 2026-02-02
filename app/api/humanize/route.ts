import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { humanizeText } from "@/lib/claude";
import { retry, humanizeSemaphore, withTimeout } from "@/lib/stability";
import { Decimal } from "@prisma/client/runtime/library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEmail(userId: string, email?: string | null) {
  return email && email.includes("@")
    ? email.toLowerCase()
    : `${userId}@no-email.local`;
}

async function ensureUser(userId: string, email: string) {
  return await retry(
    async () => {
      const byId = await prisma.user.findUnique({ where: { id: userId } });
      if (byId) {
        if (byId.email !== email) {
          return await prisma.user.update({
            where: { id: userId },
            data: { email },
          });
        }
        return byId;
      }

      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) return byEmail;

      return await prisma.user.create({
        data: { id: userId, email, tier: "free" },
      });
    },
    { attempts: 4, baseDelayMs: 300, maxDelayMs: 4000, tag: "ensureUser" }
  );
}

const LIMITS = {
  free: { daily: 2000, perRequest: 500 },
  basic: { daily: 10000, perRequest: 2000 },
  pro: { daily: 50000, perRequest: 5000 },
  unlimited: { daily: Infinity, perRequest: Infinity },
} as const;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function getDailyUsageWords(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const agg = await prisma.usage.aggregate({
    where: { userId, createdAt: { gte: start } },
    _sum: { wordsProcessed: true },
  });

  return agg._sum.wordsProcessed ?? 0;
}

// اگر خواستی بعداً واقعی‌اش کنی، همینجا تغییر بده
function getCost(words: number, _tier: keyof typeof LIMITS) {
  const base = (words / 1000) * 1.2;
  return base;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const text = body?.text;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid input text" },
        { status: 400 }
      );
    }

    const authUserId = session.user.id;
    const email = safeEmail(authUserId, session.user.email);

    const dbUser = await ensureUser(authUserId, email);

    const tier = (dbUser.tier as keyof typeof LIMITS) || "free";
    const limit = LIMITS[tier] || LIMITS.free;

    const wordCount = countWords(text);

    if (wordCount > limit.perRequest) {
      return NextResponse.json(
        {
          success: false,
          error: `Max ${limit.perRequest} words per request for ${tier} tier`,
        },
        { status: 400 }
      );
    }

    const dailyUsed = await getDailyUsageWords(dbUser.id);

    if (dailyUsed + wordCount > limit.daily) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily limit (${limit.daily} words) exceeded. Upgrade your tier.`,
        },
        { status: 400 }
      );
    }

    // ----- Humanize with semaphore + timeout -----
    await humanizeSemaphore.acquire();

    let humanized: string;
    try {
      // 35s تایم‌اوت مثل کد خودت
      humanized = await withTimeout(humanizeText(text), 35000);
    } finally {
      humanizeSemaphore.release();
    }

    const cost = getCost(wordCount, tier);

    // ----- Persist usage + text (with retry) -----
    await retry(
      async () => {
        await prisma.usage.create({
          data: {
            userId: dbUser.id,
            wordsProcessed: wordCount,
            cost: new Decimal(cost.toFixed(4)),
          },
        });
      },
      { attempts: 3, baseDelayMs: 300, maxDelayMs: 2500, tag: "createUsage" }
    );

    await retry(
      async () => {
        await prisma.text.create({
          data: {
            userId: dbUser.id,
            originalText: text,
            humanizedText: humanized,
            wordCount,
          },
        });
      },
      { attempts: 3, baseDelayMs: 300, maxDelayMs: 2500, tag: "createText" }
    );

    return NextResponse.json({
      success: true,
      humanizedText: humanized,
      meta: {
        tier,
        words: wordCount,
        dailyUsedBefore: dailyUsed,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/humanize] Unexpected error:", error);

    // Prisma init errors / pooler errors رو همون‌جا لاگ می‌کنی، ولی به UI پیام ساده می‌دی
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
