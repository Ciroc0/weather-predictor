import { motion } from "framer-motion";
import { Cloud, CloudRain, Droplets, Sun, Umbrella } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  ChartCard,
  ChartFrame,
  MetricCard,
  SectionBanner,
  SourceBadge,
} from "@/components/weather/WeatherDisplay";
import { formatDanishTime, formatShortDate, formatTooltipDateTime } from "@/lib/weather";
import type {
  DashboardExplanations,
  HistoricalRainPoint,
  TargetStatus,
  WeatherAlert,
  WeatherForecast,
} from "@/types/weather";

interface RainTabProps {
  forecast: WeatherForecast[];
  history: HistoricalRainPoint[];
  alerts: WeatherAlert[];
  rainEventStatus: TargetStatus;
  rainAmountStatus: TargetStatus;
  explanations: DashboardExplanations;
}

interface RainTimelinePoint {
  timeKey: string;
  actualProb: number | null;
  dmiProbHistory: number | null;
  mlProbHistory: number | null;
  dmiProbForecast: number | null;
  mlProbForecast: number | null;
  actualAmount: number | null;
  dmiAmountHistory: number | null;
  mlAmountHistory: number | null;
  dmiAmountForecast: number | null;
  mlAmountForecast: number | null;
}

interface TooltipPayloadItem {
  color: string;
  dataKey?: string;
  name: string;
  value: number;
}

const rainLegend = [
  { label: "DMI", color: "#27D6F5" },
  { label: "ML", color: "#F54927" },
  { label: "Faktisk", color: "#0B2EF4" },
];

const forecastLegend = [
  { label: "DMI", color: "#27D6F5" },
  { label: "ML", color: "#F54927" },
];

export function RainTab({
  forecast,
  history,
  alerts,
  rainEventStatus,
  rainAmountStatus,
  explanations,
}: RainTabProps) {
  const isMobile = useIsMobile();
  const currentRain = forecast[0];
  const hasHistory = history.length > 0;

  const timelineData: RainTimelinePoint[] = [
    ...history.map((point) => ({
      timeKey: point.timestamp,
      actualProb: point.actualRainEvent !== null ? point.actualRainEvent * 100 : null,
      dmiProbHistory: point.dmiRainProb,
      mlProbHistory: point.mlRainProb,
      dmiProbForecast: null,
      mlProbForecast: null,
      actualAmount: point.actualRainAmount,
      dmiAmountHistory: point.dmiRainAmount,
      mlAmountHistory: point.mlRainAmount,
      dmiAmountForecast: null,
      mlAmountForecast: null,
    })),
    ...forecast.map((point) => ({
      timeKey: point.timestamp,
      actualProb: null,
      dmiProbHistory: null,
      mlProbHistory: null,
      dmiProbForecast: point.dmiRainProb,
      mlProbForecast: point.mlRainProb,
      actualAmount: null,
      dmiAmountHistory: null,
      mlAmountHistory: null,
      dmiAmountForecast: point.dmiRainAmount,
      mlAmountForecast: point.mlRainAmount,
    })),
  ];

  const rainAlert = alerts.find((alert) => alert.type === "rain");
  const forecastBoundaryTimestamp = forecast[0]?.timestamp ?? null;
  const dryPeriods = forecast
    .reduce<{ start: number; end: number; hours: number }[]>((periods, point, index, all) => {
      const isDry = point.effectiveRainProb < 20;
      const previous = all[index - 1];
      const previousDry = previous ? previous.effectiveRainProb < 20 : false;
      if (isDry && !previousDry) {
        periods.push({ start: index, end: index, hours: 1 });
      } else if (isDry && periods.length > 0) {
        const latest = periods[periods.length - 1];
        latest.end = index;
        latest.hours += 1;
      }
      return periods;
    }, [])
    .filter((period) => period.hours >= 3)
    .slice(0, 3);

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
              <span className="font-semibold">
                {entry.dataKey?.toLowerCase().includes("prob")
                  ? `${entry.value.toFixed(0)}%`
                  : `${entry.value.toFixed(1)} mm`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!currentRain) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="page-stack">
      <SectionBanner
        eyebrow="Regnstatus"
        title="Start med et enkelt regnsvar"
        description={explanations.sources}
        badge={<SourceBadge source={rainEventStatus.hasActiveModel ? "ml" : "dmi"} />}
      />

      {rainAlert ? (
        <div className="rounded-[1.25rem] border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/20 dark:text-blue-200">
          <strong>{rainAlert.title}:</strong> {rainAlert.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={currentRain.effectiveRainProb > 50 ? <CloudRain className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          label="Regn lige nu"
          value={currentRain.effectiveRainProb > 50 ? "Regn i sigte" : "Toert lige nu"}
          detail={`ML: ${currentRain.mlRainProb.toFixed(0)}% • DMI: ${currentRain.dmiRainProb.toFixed(0)}%`}
          badge={<SourceBadge source={currentRain.effectiveRainProbSource} />}
          emphasis={currentRain.effectiveRainProb > 50 ? "warning" : "default"}
        />
        <MetricCard
          icon={<Droplets className="h-4 w-4" />}
          label="Naeste 24 timer"
          value={`${forecast.slice(0, 24).reduce((sum, point) => sum + point.effectiveRainAmount, 0).toFixed(1)} mm`}
          detail="Samlet forventet nedboer i det naeste doegn."
          badge={<SourceBadge source={currentRain.effectiveRainAmountSource} />}
        />
        <MetricCard
          icon={<Umbrella className="h-4 w-4" />}
          label="Naeste 48 timer"
          value={`${forecast.reduce((sum, point) => sum + point.effectiveRainAmount, 0).toFixed(1)} mm`}
          detail={`${forecast.filter((point) => point.effectiveRainProb >= 50).length} timer med hoej regnrisiko.`}
        />
      </div>

      <ChartCard
        title="Regnrisiko de naeste 48 timer"
        description="Start her, hvis du vil vide hvornår der er størst sandsynlighed for regn."
        legend={forecastLegend}
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.dmiProbForecast !== null || d.mlProbForecast !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={isMobile ? 7 : 3} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="dmiProbForecast" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              <Line type="monotone" dataKey="mlProbForecast" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Regnrisiko de sidste 7 dage"
        description="Her kan du se hvor ofte DMI og ML pegede rigtigt i forhold til faktisk registreret regn."
        legend={rainLegend}
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.actualProb !== null || d.dmiProbHistory !== null || d.mlProbHistory !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={isMobile ? 10 : 5} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<CustomTooltip />} />
              {forecastBoundaryTimestamp ? (
                <ReferenceLine
                  x={forecastBoundaryTimestamp}
                  stroke="#475569"
                  strokeWidth={2}
                  label={{ value: "Nu", position: "top", fontSize: 11, fill: "#475569", fontWeight: 600 }}
                />
              ) : null}
              {hasHistory ? <Bar dataKey="actualProb" name="Faktisk" fill="#0B2EF4" radius={[3, 3, 0, 0]} /> : null}
              <Line type="monotone" dataKey="dmiProbHistory" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              <Line type="monotone" dataKey="mlProbHistory" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Regnmaengde de naeste 48 timer"
        description="Brug denne graf, hvis du vil se hvor meget regn der kan falde, ikke kun sandsynligheden for at det sker."
        legend={forecastLegend}
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.dmiAmountForecast !== null || d.mlAmountForecast !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={isMobile ? 7 : 3} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="dmiAmountForecast" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              <Line type="monotone" dataKey="mlAmountForecast" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Regnmaengde de sidste 7 dage"
        description={rainAmountStatus.statusDescription}
        legend={rainLegend}
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.actualAmount !== null || d.dmiAmountHistory !== null || d.mlAmountHistory !== null)}
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
              {hasHistory ? <Bar dataKey="actualAmount" name="Faktisk" fill="#0B2EF4" radius={[3, 3, 0, 0]} /> : null}
              <Line type="monotone" dataKey="dmiAmountHistory" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              <Line type="monotone" dataKey="mlAmountHistory" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      {dryPeriods.length > 0 ? (
        <section className="section-stack">
          <div className="space-y-2">
            <p className="section-eyebrow">Mulige pauser i regnen</p>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Mulige toerre perioder</h3>
            <p className="copy-measure text-sm leading-6 text-slate-600 dark:text-slate-400">
              Hvis du vil planlaegge en kort tur uden regn, er det disse vinduer du skal starte med at kigge paa.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dryPeriods.map((period) => (
              <div
                key={`${period.start}-${period.end}`}
                className="panel-card flex min-w-0 items-center justify-between gap-3 rounded-[1.35rem] py-0"
              >
                <div className="flex min-w-0 items-center gap-3 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Cloud className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-50">
                      kl. {formatDanishTime(forecast[period.start]?.timestamp)} til kl. {formatDanishTime(forecast[period.end]?.timestamp)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {forecast[period.start] ? formatShortDate(forecast[period.start].timestamp) : "Ukendt dato"}
                    </p>
                  </div>
                </div>
                <div className="pr-4 text-sm font-semibold text-amber-700 dark:text-amber-300">{period.hours} t</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </motion.div>
  );
}
