import UsageMeter from "@/components/usage-meter"
import HumanizerForm from "@/components/humanizer-form"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <UsageMeter />
      <HumanizerForm />
    </div>
  )
}
