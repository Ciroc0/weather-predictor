import { WindTab } from "@/components/weather/WindTab";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";

export function WindPage() {
  const { response } = useDashboardOutlet();
  return (
    <WindTab
      forecast={response.snapshot.forecast}
      alerts={response.snapshot.alerts}
      windStatus={response.snapshot.targetStatus.wind_speed}
      gustStatus={response.snapshot.targetStatus.wind_gust}
      explanations={response.snapshot.explanations}
    />
  );
}
