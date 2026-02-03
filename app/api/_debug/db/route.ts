import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function mask(urlStr?: string) {
  if (!urlStr) return null
  try {
    const u = new URL(urlStr)
    if (u.password) u.password = "****"
    if (u.username) u.username = u.username.replace(/.(?=.{4})/g, "*")
    return u.toString()
  } catch {
    return "INVALID_URL"
  }
}

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: mask(process.env.DATABASE_URL),
    DIRECT_URL: mask(process.env.DIRECT_URL),
    NODE_ENV: process.env.NODE_ENV,
  })
}
