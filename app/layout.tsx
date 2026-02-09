import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toast"

export const metadata: Metadata = {
  title: "Humanize",
  description: "Rewrite English text to sound clearer and more natural.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        {/* ✅ Force dark as default */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Navbar />

          <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
            {children}
          </main>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
