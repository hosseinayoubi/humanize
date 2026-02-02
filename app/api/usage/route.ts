import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { retry } from "@/lib/stability";

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

async function getDailyUsageWords(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const agg = await prisma.usage.aggregate({
    where: { userId, createdAt: { gte: start } },
    _sum: { wordsProcessed: true },
  });

  return agg._sum.wordsProcessed ?? 0;
}

export async function GET(req: NextRequest) {
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

    const authUserId = session.user.id;
    const email = safeEmail(authUserId, session.user.email);

    const dbUser = await ensureUser(authUserId, email);

    const tier = (dbUser.tier as keyof typeof LIMITS) || "free";
    const limit = LIMITS[tier] || LIMITS.free;

    const dailyUsedWords = await getDailyUsageWords(dbUser.id);

    // تعداد رکوردهایی که برگردانیم (اختیاری)
    const takeParam = req.nextUrl.searchParams.get("take");
    const take = Math.min(Math.max(Number(takeParam ?? 10) || 10, 1), 50);

    const recent = await prisma.usage.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        wordsProcessed: true,
        cost: true,
      },
    });

    const remaining =
      limit.daily === Infinity ? Infinity : Math.max(limit.daily - dailyUsedWords, 0);

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        tier,
      },
      limits: {
        daily: limit.daily,
        perRequest: limit.perRequest,
      },
      today: {
        usedWords: dailyUsedWords,
        remainingWords: remaining,
      },
      recentUsage: recent,
    });
  } catch (error: any) {
    console.error("[GET /api/usage] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load usage" },
      { status: 500 }
    );
  }
}
