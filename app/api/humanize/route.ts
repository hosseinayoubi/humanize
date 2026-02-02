import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, output } = body;

    if (!input || !output) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const record = await prisma.usage.create({
      data: {
        input,
        output,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("POST /api/humanize error:", error);
    return NextResponse.json(
      { error: "Humanize failed" },
      { status: 500 }
    );
  }
}
