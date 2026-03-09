import { RainTab } from "@/components/weather/RainTab";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";

export function RainPage() {
  const { response } = useDashboardOutlet();
  return (
    <RainTab
      forecast={response.snapshot.forecast}
      history={response.snapshot.history.rain}
      alerts={response.snapshot.alerts}
      rainEventStatus={response.snapshot.targetStatus.rain_event}
      rainAmountStatus={response.snapshot.targetStatus.rain_amount}
      explanations={response.snapshot.explanations}
    />
  );
}
