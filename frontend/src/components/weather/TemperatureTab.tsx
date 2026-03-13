import { motion } from "framer-motion";
import { Info, Thermometer, TrendingDown } from "lucide-react";
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

import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDanishTime, formatShortDate, formatTooltipDateTime } from "@/lib/weather";
import type {
  DashboardExplanations,
  HistoricalTemperaturePoint,
  TargetStatus,
  VerificationMetrics,
  WeatherForecast,
} from "@/types/weather";
import {
  ChartCard,
  ChartFrame,
  MetricCard,
  SectionBanner,
  SourceBadge,
} from "@/components/weather/WeatherDisplay";

interface TemperatureTabProps {
  forecast: WeatherForecast[];
  history: HistoricalTemperaturePoint[];
  verification: VerificationMetrics;
  targetStatus: TargetStatus;
  explanations: DashboardExplanations;
}

interface TemperatureTimelinePoint {
  timeKey: string;
  actual: number | null;
  dmiHistory: number | null;
  mlHistory: number | null;
  dmiForecast: number | null;
  mlForecast: number | null;
  apparentForecast: number | null;
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

const temperatureLegend = [
  { label: "DMI", color: "#27D6F5" },
  { label: "ML", color: "#F54927" },
  { label: "Faktisk", color: "#0B2EF4" },
];

const forecastLegend = [
  { label: "DMI", color: "#27D6F5" },
  { label: "ML", color: "#F54927" },
  { label: "Foeles som", color: "#f59e0b" },
];

export function TemperatureTab({
  forecast,
  history,
  verification,
  targetStatus,
  explanations,
}: TemperatureTabProps) {
  const isMobile = useIsMobile();
  const hasMlSeries = targetStatus.hasActiveModel && forecast.some((point) => point.mlTemp !== null);
  const hasHistory = history.length > 0;

  const timelineData: TemperatureTimelinePoint[] = [
    ...history.map((point) => ({
      timeKey: point.timestamp,
      actual: point.actual,
      dmiHistory: point.dmiTemp,
      mlHistory: point.mlTemp,
      dmiForecast: null,
      mlForecast: null,
      apparentForecast: null,
    })),
    ...forecast.map((point) => ({
      timeKey: point.timestamp,
      actual: null,
      dmiHistory: null,
      mlHistory: null,
      dmiForecast: point.dmiTemp,
      mlForecast: hasMlSeries ? point.mlTemp : null,
      apparentForecast: point.apparentTemp,
    })),
  ];

  const differences = forecast
    .map((point) =>
      point.dmiTemp !== null && point.mlTemp !== null ? Math.abs(point.dmiTemp - point.mlTemp) : null,
    )
    .filter((value): value is number => value !== null);
  const avgDiff =
    differences.length > 0 ? differences.reduce((sum, value) => sum + value, 0) / differences.length : null;
  const maxDiff = differences.length > 0 ? Math.max(...differences) : null;
  const forecastBoundaryTimestamp = forecast[0]?.timestamp ?? null;

  const improvement =
    verification.rmseDmi !== null && verification.rmseMl !== null && verification.rmseDmi > 0
      ? ((verification.rmseDmi - verification.rmseMl) / verification.rmseDmi) * 100
      : null;

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
              <span className="font-semibold">{entry.value.toFixed(1)}°C</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="page-stack">
      <SectionBanner
        eyebrow="Temperaturstatus"
        title="Start med den aktuelle temperaturhistorie"
        description={targetStatus.statusDescription}
        badge={<SourceBadge source={targetStatus.hasActiveModel ? "ml" : "dmi"} />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Dokumenteret forbedring"
          value={improvement !== null ? `${improvement.toFixed(1)}%` : "Vurderes loebende"}
          detail={
            improvement !== null
              ? "ML har lavere temperaturfejl end DMI i den verificerede periode."
              : "Der er endnu ikke nok verificeret historik til en tydelig forbedring."
          }
          emphasis={improvement !== null && improvement > 0 ? "accent" : "default"}
        />
        <MetricCard
          icon={<Thermometer className="h-4 w-4" />}
          label="Typisk forskel lige nu"
          value={avgDiff !== null ? `${avgDiff.toFixed(1)}°C` : "Ingen aktiv forskel"}
          detail="Viser hvor langt DMI og ML typisk ligger fra hinanden i forecastet."
          badge={<SourceBadge source={hasMlSeries ? "ml" : "dmi"} />}
        />
        <MetricCard
          icon={<Info className="h-4 w-4" />}
          label="Stoerste afvigelse"
          value={maxDiff !== null ? `${maxDiff.toFixed(1)}°C` : "Ingen afvigelse"}
          detail={explanations.forecast}
        />
      </div>

      <ChartCard
        title="Temperatur de naeste 48 timer"
        description="Start her, hvis du vil vide hvordan temperaturen forventes at udvikle sig. DMI og ML vises side om side, og 'foeles som' er med som ekstra hverdagskontekst."
        legend={forecastLegend}
        action={
          <div className="hidden md:block">
            <TooltipProvider>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white">
                    Saadan laeser du grafen
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-medium">Forecast:</p>
                  <p>DMI og ML viser de to bud paa temperaturen. Den stiplede linje viser hvordan det foeles.</p>
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </div>
        }
      >
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400 md:hidden">
          DMI og ML viser de to bud paa temperaturen. Den stiplede linje viser hvordan det foeles.
        </p>
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.dmiForecast !== null || d.mlForecast !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis
                dataKey="timeKey"
                tick={{ fontSize: 11 }}
                tickFormatter={(value: string) => formatShortDate(value)}
                tickMargin={10}
                interval={isMobile ? 7 : 3}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}°`} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="dmiForecast" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              {hasMlSeries ? (
                <Line type="monotone" dataKey="mlForecast" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
              <Line
                type="monotone"
                dataKey="apparentForecast"
                name="Foeles som"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="6 5"
                dot={false}
                strokeOpacity={0.95}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <ChartCard
        title="Hvordan modellen ramte de sidste 7 dage"
        description="Her sammenlignes DMI og ML med den faktisk maalte temperatur. Det giver et hurtigt svar paa hvem der har ligget taettest paa virkeligheden."
        legend={temperatureLegend}
        footer="Backtest viser tidligere prognoser holdt op mod det vejr, der senere blev målt."
      >
        <ChartFrame>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData.filter((d) => d.actual !== null || d.dmiHistory !== null || d.mlHistory !== null)}
              margin={{ top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
              <XAxis
                dataKey="timeKey"
                tick={{ fontSize: 11 }}
                tickFormatter={(value: string) => formatShortDate(value)}
                tickMargin={10}
                interval={isMobile ? 10 : 5}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}°`} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip content={<CustomTooltip />} />
              {forecastBoundaryTimestamp ? (
                <ReferenceLine
                  x={forecastBoundaryTimestamp}
                  stroke="#475569"
                  strokeWidth={2}
                  label={{ value: "Nu", position: "top", fontSize: 11, fill: "#475569", fontWeight: 600 }}
                />
              ) : null}
              <Line type="monotone" dataKey="dmiHistory" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              {hasMlSeries ? (
                <Line type="monotone" dataKey="mlHistory" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
              {hasHistory ? (
                <Line type="monotone" dataKey="actual" name="Faktisk" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.95} />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartFrame>
      </ChartCard>

      <section className="section-stack">
        <div className="space-y-2">
          <p className="section-eyebrow">Time for time</p>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Naeste 16 timer</h3>
          <p className="copy-measure text-sm leading-6 text-slate-600 dark:text-slate-400">
            Brug kortene her, hvis du vil have et mere jordnaert overblik uden at laese grafer.
          </p>
        </div>
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] md:grid md:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] md:overflow-visible md:px-0">
          {forecast.slice(0, 16).map((hour, index) => (
            <div key={hour.timestamp} className="panel-card min-w-[10.5rem] snap-start py-0 md:min-w-0">
              <div className="p-4">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    kl. {formatDanishTime(hour.timestamp)}
                  </p>
                  <SourceBadge source={hour.effectiveTempSource} />
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)}°` : "—"}
                </p>
                <div className="mt-3 space-y-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <p>ML {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "ikke aktiv"}</p>
                  <p>DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "ingen data"}</p>
                  {hour.apparentTemp !== null ? <p>Foeles {Math.round(hour.apparentTemp)}°</p> : null}
                </div>
                {index === 0 ? (
                  <div className="mt-4">
                    <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-300">
                      Nu
                    </Badge>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
