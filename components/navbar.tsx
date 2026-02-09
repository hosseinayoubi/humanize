"use client"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"

function initials(email?: string | null) {
  if (!email) return "U"
  const part = email.split("@")[0] || "U"
  const a = (part[0] || "U").toUpperCase()
  const b = (part[1] || "").toUpperCase()
  return (a + b).trim() || "U"
}

export default function Navbar() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null))
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
    router.push("/")
    router.refresh()
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">H</span>
          <span>Humanize AI</span>
        </Link>

        <nav className="flex items-center gap-2">
          {email ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-md border px-2 py-1.5 hover:bg-muted">
                  <Avatar className="h-8 w-8"><AvatarFallback>{initials(email)}</AvatarFallback></Avatar>
                  <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="secondary"><Link href="/login">Log in</Link></Button>
              <Button asChild><Link href="/signup">Start Free</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
