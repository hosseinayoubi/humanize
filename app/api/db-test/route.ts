import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function maskDb(url?: string) {
  if (!url) return "MISSING"
  try {
    const u = new URL(url)
    if (u.password) u.password = "****"
    return u.toString()
  } catch {
    return "INVALID_URL"
  }
}

export async function GET() {
  try {
    // ✅ فقط یوزر لاگین‌شده
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      )
    }

    const t0 = Date.now()

    // ✅ تست اتصال واقعی
    await prisma.$queryRaw`SELECT 1`

    const ms = Date.now() - t0

    return NextResponse.json({
      success: true,
      ok: true,
      latencyMs: ms,
      env: {
        DATABASE_URL: maskDb(process.env.DATABASE_URL),
        DIRECT_URL: maskDb(process.env.DIRECT_URL),
        NODE_ENV: process.env.NODE_ENV,
      },
    })
  } catch (error: any) {
    console.error("[GET /api/db-test] ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: error?.message || "DB test failed",
        name: error?.name,
        code: error?.code,
      },
      { status: 500 },
    )
  }
}
