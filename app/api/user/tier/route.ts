import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"
import { clampTier } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function safeEmail(userId: string, email?: string | null) {
  return email && email.includes("@") ? email : `${userId}@no-email.local`
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      )
    }

    const body = await req.json().catch(() => null)
    const tier = clampTier(body?.tier)

    const userId = session.user.id
    const email = safeEmail(userId, session.user.email)

    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      user = await prisma.user.create({ data: { id: userId, email, tier } })
    } else {
      user = await prisma.user.update({ where: { id: userId }, data: { email, tier } })
    }

    return NextResponse.json({ success: true, tier: user.tier, message: "Tier updated successfully" })
  } catch (error) {
    console.error("Update Tier API Error:", error)
    return NextResponse.json(
      { success: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 },
    )
  }
}
