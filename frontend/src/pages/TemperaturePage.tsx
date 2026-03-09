import { TemperatureTab } from "@/components/weather/TemperatureTab";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";

export function TemperaturePage() {
  const { response } = useDashboardOutlet();
  return (
    <TemperatureTab
      forecast={response.snapshot.forecast}
      verification={response.snapshot.verification}
      targetStatus={response.snapshot.targetStatus.temperature}
      explanations={response.snapshot.explanations}
    />
  );
}
