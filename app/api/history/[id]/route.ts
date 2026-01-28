import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const row = await prisma.text.findUnique({ where: { id: params.id } })
    if (!row) {
      return NextResponse.json(
        { success: false, error: "Text not found", code: "TEXT_NOT_FOUND" },
        { status: 404 }
      )
    }

    if (row.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      )
    }

    await prisma.text.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true, message: "Text deleted successfully" })
  } catch (error) {
    console.error("Delete Text API Error:", error)
    return NextResponse.json(
      { success: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    )
  }
}
