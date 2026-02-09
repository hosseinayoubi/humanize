// app/(auth)/signup/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"

const COOLDOWN_SECONDS = 60
const LS_KEY = "signup_last_attempt_ms"

function toRemainingSeconds(lastAttemptMs: number) {
  const elapsedMs = Date.now() - lastAttemptMs
  const remaining = COOLDOWN_SECONDS - Math.floor(elapsedMs / 1000)
  return Math.max(0, remaining)
}

function isRateLimitError(msg: string) {
  const m = (msg || "").toLowerCase()
  return (
    m.includes("rate limit") ||
    m.includes("too many") ||
    m.includes("email rate limit") ||
    m.includes("over email send rate limit")
  )
}

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      const last = raw ? Number(raw) : 0
      if (last > 0) setCooldown(toRemainingSeconds(last))
    } catch {}
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s and try again.`)
      return
    }

    try {
      localStorage.setItem(LS_KEY, String(Date.now()))
    } catch {}
    setCooldown(COOLDOWN_SECONDS)

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        const msg = data?.error || "Sign up failed."
        if (isRateLimitError(msg)) {
          toast.error("Too many signup attempts. Please wait a few minutes and try again.")
        } else {
          toast.error(msg)
        }
        return
      }

      toast.success("Account created. Check your email to confirm.")
      router.push("/login")
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? "Sign up failed.")
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || cooldown > 0
  const buttonText = loading
    ? "Creating..."
    : cooldown > 0
      ? `Try again in ${cooldown}s`
      : "Create account"

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>English-only humanizer. Email & password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
                disabled={loading}
              />
            </div>

            <Button className="w-full" type="submit" disabled={disabled}>
              {buttonText}
            </Button>

            {cooldown > 0 && (
              <p className="text-xs text-muted-foreground">
                We’re preventing repeated signup requests to avoid email limits.
              </p>
            )}
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="underline" href="/login">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
