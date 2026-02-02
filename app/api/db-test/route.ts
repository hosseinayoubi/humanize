import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (e: any) {
    console.error("[GET /api/db-test] prisma error:", e);
    return NextResponse.json(
      { ok: false, db: "failed", error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
