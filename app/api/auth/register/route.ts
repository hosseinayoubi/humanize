import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBaseUrl(req: NextRequest) {
  // بهترین حالت: از env بخون
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) return envUrl.replace(/\/$/, "")

  // fallback: از خود request درست کن
  const proto = req.headers.get("x-forwarded-proto") ?? "http"
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  return `${proto}://${host}`
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const body = await req.json().catch(() => null)
  const email = body?.email
  const password = body?.password

  if (!email || !password) {
    return NextResponse.json({ success: false, error: "email/password required" }, { status: 400 })
  }

  const baseUrl = getBaseUrl(req)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // ✅ این مهم‌ترین خطه: لینک تأیید ایمیل باید بره روی دامنه واقعی
      emailRedirectTo: `${baseUrl}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data })
}
