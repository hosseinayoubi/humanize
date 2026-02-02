import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ db: "ok" });
  } catch (e) {
    return NextResponse.json({ db: "failed", error: String(e) }, { status: 500 });
  }
}
