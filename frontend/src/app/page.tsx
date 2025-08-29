import { MauFlowDashboard } from "@/components/dashboard/MauFlowDashboard";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Home() {
  return (
    <AppLayout>
      <MauFlowDashboard />
    </AppLayout>
  );
}
