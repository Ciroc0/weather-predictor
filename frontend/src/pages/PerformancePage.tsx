import { PerformanceTab } from "@/components/weather/PerformanceTab";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";

export function PerformancePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;

  return (
    <PerformanceTab
      verification={snapshot.verification}
      leadBuckets={snapshot.leadBuckets}
      featureImportance={snapshot.featureImportance}
      modelInfo={snapshot.modelInfo}
    />
  );
}
