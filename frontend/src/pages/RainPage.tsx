import { RainTab } from "@/components/weather/RainTab";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";

export function RainPage() {
  const { response } = useDashboardOutlet();
  return <RainTab forecast={response.snapshot.forecast} alerts={response.snapshot.alerts} />;
}
