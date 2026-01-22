import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"
import { clampTier } from "@/lib/auth"

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })

    const body = await req.json().catch(() => null)
    const tier = clampTier(body?.tier)

    const email = session.user.email ?? "unknown@example.com"
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      update: { email, tier },
      create: { id: session.user.id, email, tier }
    })

    return NextResponse.json({ success: true, tier: user.tier, message: "Tier updated successfully" })
  } catch (error) {
    console.error("Update Tier API Error:", error)
    return NextResponse.json({ success: false, error: "Server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
