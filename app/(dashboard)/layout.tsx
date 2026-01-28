export const dynamic = "force-dynamic"
export const revalidate = 0

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Rewrite English text to sound more natural.
        </p>
      </div>
      {children}
    </div>
  )
}
