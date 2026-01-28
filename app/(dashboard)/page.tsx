import UsageMeter from "@/components/usage-meter"
import HumanizerForm from "@/components/humanizer-form"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <UsageMeter />
      <HumanizerForm />
    </div>
  )
}
