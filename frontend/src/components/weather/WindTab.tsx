import { motion } from "framer-motion";
import { AlertTriangle, Compass, Navigation, Wind } from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ChartCard,
  ChartFrame,
  MetricCard,
  SectionBanner,
  SourceBadge,
} from "@/components/weather/WeatherDisplay";
import {
  formatDanishTime,
  formatShortDate,
  formatTooltipDateTime,
  getSourceLabel,
  getWindDirectionLabel,
} from "@/lib/weather";
import type {
  DashboardExplanations,
  HistoricalWindPoint,
  TargetStatus,
  WeatherAlert,
  WeatherForecast,
} from "@/types/weather";

interface WindTabProps {
  forecast: WeatherForecast[];
  history: HistoricalWindPoint[];
  alerts: WeatherAlert[];
  windStatus: TargetStatus;
  gustStatus: TargetStatus;
  explanations: DashboardExplanations;
}

interface WindTimelinePoint {
  timeKey: string;
  actualSpeed: number | null;
  dmiSpeedHistory: number | null;
  mlSpeedHistory: number | null;
  dmiSpeedForecast: number | null;
  mlSpeedForecast: number | null;
  actualGust: number | null;
  dmiGustHistory: number | null;
  mlGustHistory: number | null;
  dmiGustForecast: number | null;
  mlGustForecast: number | null;
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

const speedLegend = [
  { label: "DMI", color: "#27D6F5" },
  { label: "ML", color: "#F54927" },
  { label: "Faktisk", color: "#0B2EF4" },
];

const forecastLegend = [
  { label: "DMI", color: "#27D6F5" },
  { label: "ML", color: "#F54927" },
];

function WindCompass({ direction, size = 92 }: { direction: number | null; size?: number }) {
  const label = getWindDirectionLabel(direction);
  const rotation = direction === null ? 0 : direction + 180;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
      style={{ width: size, height: size }}
    >
      <span className="absolute top-1.5 text-[10px] font-bold text-slate-400">N</span>
      <span className="absolute right-1.5 text-[10px] font-bold text-slate-400">O</span>
      <span className="absolute bottom-1.5 text-[10px] font-bold text-slate-400">S</span>
      <span className="absolute left-1.5 text-[10px] font-bold text-slate-400">V</span>
      <motion.div animate={{ rotate: rotation }} transition={{ duration: 0.45, ease: "easeOut" }}>
        <Navigation className="h-8 w-8 text-sky-500" fill="currentColor" />
      </motion.div>
      <span className="absolute bottom-5 text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

export function WindTab({
  forecast,
  history,
  alerts,
  windStatus,
  gustStatus,
  explanations,
}: WindTabProps) {
  const isMobile = useIsMobile();
  const hasMlSpeed = windStatus.hasActiveModel && forecast.some((point) => point.mlWindSpeed !== null);
  const hasMlGust = gustStatus.hasActiveModel && forecast.some((point) => point.mlWindGust !== null);
  const hasHistory = history.length > 0;

  const timelineData: WindTimelinePoint[] = [
    ...history.map((point) => ({
      timeKey: point.timestamp,
      actualSpeed: point.actualWindSpeed,
      dmiSpeedHistory: point.dmiWindSpeed,
      mlSpeedHistory: point.mlWindSpeed,
      dmiSpeedForecast: null,
      mlSpeedForecast: null,
      actualGust: point.actualWindGust,
      dmiGustHistory: point.dmiWindGust,
      mlGustHistory: point.mlWindGust,
      dmiGustForecast: null,
      mlGustForecast: null,
    })),
    ...forecast.map((point) => ({
      timeKey: point.timestamp,
      actualSpeed: null,
      dmiSpeedHistory: null,
      mlSpeedHistory: null,
      dmiSpeedForecast: point.dmiWindSpeed,
      mlSpeedForecast: hasMlSpeed ? point.mlWindSpeed : null,
      actualGust: null,
      dmiGustHistory: null,
      mlGustHistory: null,
      dmiGustForecast: point.dmiWindGust,
      mlGustForecast: hasMlGust ? point.mlWindGust : null,
    })),
  ];

  const warning = alerts.find((alert) => alert.type === "wind");
  const currentWind = forecast[0];
  const forecastBoundaryTimestamp = forecast[0]?.timestamp ?? null;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="max-w-[15rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 font-medium">{formatTooltipDateTime(label)}</p>
        <div className="space-y-1.5">
          {payload.map((entry) => (
            <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
              <span className="font-semibold">{entry.value.toFixed(1)} m/s</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!currentWind) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="page-stack">
      {warning ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>{warning.message}</AlertDescription>
        </Alert>
      ) : null}

      <SectionBanner
        eyebrow="Vindstatus"
        title="Brug de tre kort herunder for et hurtigt svar"
        description={explanations.sources}
        badge={<SourceBadge source={windStatus.hasActiveModel ? "ml" : "dmi"} />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Wind className="h-4 w-4" />}
          label="Vindhastighed nu"
          value={currentWind.effectiveWindSpeed !== null ? `${currentWind.effectiveWindSpeed.toFixed(1)} m/s` : "—"}
          detail={`ML: ${currentWind.mlWindSpeed !== null ? `${currentWind.mlWindSpeed.toFixed(1)} m/s` : "ikke aktiv"} • DMI: ${currentWind.dmiWindSpeed !== null ? `${currentWind.dmiWindSpeed.toFixed(1)} m/s` : "ingen data"}`}
          badge={<SourceBadge source={currentWind.effectiveWindSpeedSource} />}
          emphasis={currentWind.effectiveWindSpeed !== null && currentWind.effectiveWindSpeed >= 12 ? "warning" : "default"}
        />
        <MetricCard
          icon={<Wind className="h-4 w-4" />}
          label="Vindstoed nu"
          value={currentWind.effectiveWindGust !== null ? `${currentWind.effectiveWindGust.toFixed(1)} m/s` : "—"}
          detail={`ML: ${currentWind.mlWindGust !== null ? `${currentWind.mlWindGust.toFixed(1)} m/s` : "ikke aktiv"} • DMI: ${currentWind.dmiWindGust !== null ? `${currentWind.dmiWindGust.toFixed(1)} m/s` : "ingen data"}`}
          badge={<SourceBadge source={currentWind.effectiveWindGustSource} />}
        />
        <div className="panel-card rounded-[1.5rem] py-0">
          <div className="flex h-full flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between md:flex-col md:items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Compass className="h-4 w-4" />
                Vindretning
              </div>
              <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {getWindDirectionLabel(currentWind.windDirection)}
              </p>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                {currentWind.windDirection !== null ? `${Math.round(currentWind.windDirection)}°` : "Ingen data"}
              </p>
            </div>
            <WindCompass direction={currentWind.windDirection} size={isMobile ? 86 : 104} />
          </div>
        </div>
      </div>

      <ChartCard
        title="Vindhastighed de naeste 48 timer"
        description="Start her, hvis du vil vide hvordan vinden udvikler sig fremadrettet."
        legend={forecastLegend}
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.dmiSpeedForecast !== null || d.mlSpeedForecast !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={isMobile ? 7 : 3} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="dmiSpeedForecast" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              {hasMlSpeed ? (
                <Line type="monotone" dataKey="mlSpeedForecast" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Vindhastighed de sidste 7 dage"
        description="Backtest viser hvordan DMI og ML har klaret sig mod faktisk målt vind."
        legend={speedLegend}
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.actualSpeed !== null || d.dmiSpeedHistory !== null || d.mlSpeedHistory !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={isMobile ? 10 : 5} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
              <Tooltip content={<CustomTooltip />} />
              {forecastBoundaryTimestamp ? (
                <ReferenceLine
                  x={forecastBoundaryTimestamp}
                  stroke="#475569"
                  strokeWidth={2}
                  label={{ value: "Nu", position: "top", fontSize: 11, fill: "#475569", fontWeight: 600 }}
                />
              ) : null}
              <Line type="monotone" dataKey="dmiSpeedHistory" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              {hasMlSpeed ? (
                <Line type="monotone" dataKey="mlSpeedHistory" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
              {hasHistory ? (
                <Line type="monotone" dataKey="actualSpeed" name="Faktisk" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Vindstoed de naeste 48 timer"
        description="Vindstoed er nyttigt, hvis du vil vurdere hvor kraftige ryk vinden kan komme med."
        legend={forecastLegend}
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.dmiGustForecast !== null || d.mlGustForecast !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={isMobile ? 7 : 3} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="dmiGustForecast" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              {hasMlGust ? (
                <Line type="monotone" dataKey="mlGustForecast" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Vindstoed de sidste 7 dage"
        description="Her kan du se om modellen ogsaa har ramt de kraftigste pust bedre end DMI."
        legend={speedLegend}
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.actualGust !== null || d.dmiGustHistory !== null || d.mlGustHistory !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={isMobile ? 10 : 5} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
              <Tooltip content={<CustomTooltip />} />
              {forecastBoundaryTimestamp ? (
                <ReferenceLine
                  x={forecastBoundaryTimestamp}
                  stroke="#475569"
                  strokeWidth={2}
                  label={{ value: "Nu", position: "top", fontSize: 11, fill: "#475569", fontWeight: 600 }}
                />
              ) : null}
              <Line type="monotone" dataKey="dmiGustHistory" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              {hasMlGust ? (
                <Line type="monotone" dataKey="mlGustHistory" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
              {hasHistory ? (
                <Line type="monotone" dataKey="actualGust" name="Faktisk" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <section className="section-stack">
        <div className="space-y-2">
          <p className="section-eyebrow">Vindretning time for time</p>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Vindretning de naeste 12 timer</h3>
          <p className="copy-measure text-sm leading-6 text-slate-600 dark:text-slate-400">
            Kortene herunder er gode, hvis du bare vil se hvorfra vinden kommer og hvor kraftig den er.
          </p>
        </div>
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] md:grid md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] md:overflow-visible md:px-0">
          {forecast.slice(0, 12).map((hour) => (
            <div key={hour.timestamp} className="panel-card min-w-[9rem] snap-start py-0 md:min-w-0">
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <WindCompass direction={hour.windDirection} size={70} />
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    kl. {formatDanishTime(hour.timestamp)}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {hour.effectiveWindSpeed !== null ? `${hour.effectiveWindSpeed.toFixed(0)} m/s` : "—"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getSourceLabel(hour.effectiveWindSpeedSource)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
