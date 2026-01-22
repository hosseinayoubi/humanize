"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (!data.session) {
        toast.success("Account created. Check your email to confirm.")
        router.push("/login")
      } else {
        toast.success("Account created.")
        router.push("/dashboard")
      }
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? "Sign up failed.")
    } finally {
      setLoading(false)
    }
  }

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
              <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">Already have an account? <Link className="underline" href="/login">Log in</Link></p>
        </CardContent>
      </Card>
    </div>
  )
}
