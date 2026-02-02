import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // تست ساده و مطمئن اتصال
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      db: "connected",
      ts: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[GET /api/db-test] Prisma error:", e);
    return NextResponse.json(
      {
        ok: false,
        db: "failed",
        error: String(e?.message ?? e),
      },
      { status: 500 }
    );
  }
}
