import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toast"

export const metadata: Metadata = {
  title: "Humanize AI",
  description: "English-only AI text humanizer with Supabase Auth + Prisma.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />

          {/* Main spacing: fixes “stuck to top/edges” on all pages, including /dashboard */}
          <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
            {children}
          </main>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
