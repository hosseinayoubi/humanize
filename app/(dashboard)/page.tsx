export const dynamic = "force-dynamic";

import UsageMeter from "@/components/usage-meter";
import HumanizerForm from "@/components/humanizer-form";

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <UsageMeter />
      <HumanizerForm />
    </div>
  );
}
