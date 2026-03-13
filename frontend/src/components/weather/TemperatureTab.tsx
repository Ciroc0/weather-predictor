
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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDanishTime, formatShortDate, formatTooltipDateTime, getSourceLabel } from "@/lib/weather";
import type {
  DashboardExplanations,
  HistoricalTemperaturePoint,
  TargetStatus,
  VerificationMetrics,
  WeatherForecast,
} from "@/types/weather";

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

export function TemperatureTab({
  forecast,
  history,
  verification,
  targetStatus,
  explanations,
}: TemperatureTabProps) {
  const hasMlSeries = targetStatus.hasActiveModel && forecast.some((point) => point.mlTemp !== null);
  const hasHistory = history.length > 0;
  // Always show all data series
  const showDmi = true;
  const showMl = hasMlSeries;

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
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 font-medium">{formatTooltipDateTime(label)}</p>
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
            <span className="font-semibold">{entry.value.toFixed(1)}°C</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={targetStatus.hasActiveModel ? "default" : "secondary"}>
              {targetStatus.statusLabel}
            </Badge>
            <Badge variant="outline">{explanations.forecast}</Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{targetStatus.statusDescription}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            <TrendingDown className="h-4 w-4" />
            {improvement !== null
              ? `ML har ${improvement.toFixed(1)}% lavere fejl end DMI`
              : "Temperaturmodellen evalueres løbende"}
          </div>
          <Badge variant="secondary">
            {avgDiff !== null ? `Typisk forskel: ${avgDiff.toFixed(2)}°C` : "Ingen aktiv ML-forskel endnu"}
          </Badge>
          <Badge variant="outline">
            {maxDiff !== null ? `Største forskel: ${maxDiff.toFixed(1)}°C` : "Ingen største forskel endnu"}
          </Badge>
        </div>
        <TooltipProvider>
          <UiTooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
                <Info className="h-4 w-4" />
                Sådan læser du grafen
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="font-medium mb-1">Backtest (historik):</p>
              <p className="mb-2">Sort streg = faktisk målt temperatur. Rød/grøn = DMI/ML prognoser for de samme tidspunkter.</p>
              <p className="font-medium mb-1">Forecast (fremtid):</p>
              <p>Rød stiplede linje = DMI prognose. Grøn stiplede linje = ML justeret prognose.</p>
            </TooltipContent>
          </UiTooltip>
        </TooltipProvider>
      </div>

      {/* Backtest Graf */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-slate-500" />
              Temperatur backtest - Sidste 7 dage
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#27D6F5]"></span> DMI</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#F54927]"></span> ML</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#0B2EF4]"></span> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter(d => d.actual !== null || d.dmiHistory !== null || d.mlHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis
                  dataKey="timeKey"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: string) => formatShortDate(value)}
                  tickMargin={8}
                  interval={5}
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
                {showDmi ? (
                  <Line type="monotone" dataKey="dmiHistory" name="DMI Backtest" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                ) : null}
                {showMl && hasMlSeries ? (
                  <Line type="monotone" dataKey="mlHistory" name="ML Backtest" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                ) : null}
                {hasHistory ? (
                  <Line type="monotone" dataKey="actual" name="Faktisk temperatur" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Sammenligning af DMI's prognose, ML-model og faktisk målt temperatur de sidste 7 dage.
          </p>
        </CardContent>
      </Card>

      {/* Forecast Graf */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-slate-500" />
              Temperatur forecast - Næste 48 timer
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#27D6F5]"></span> DMI</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#F54927]"></span> ML</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500"></span> Føles som</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Faktisk data kan først vises når tiden er gået — her ser du vores prognoser for fremtiden.
          </p>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter(d => d.dmiForecast !== null || d.mlForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis
                  dataKey="timeKey"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: string) => formatShortDate(value)}
                  tickMargin={8}
                  interval={3}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}°`} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip content={<CustomTooltip />} />
                {showDmi ? (
                  <Line
                    type="monotone"
                    dataKey="dmiForecast"
                    name="DMI Forecast"
                    stroke="#27D6F5"
                    strokeWidth={3}
                    dot={false}
                    strokeOpacity={0.9}
                  />
                ) : null}
                {showMl && hasMlSeries ? (
                  <Line
                    type="monotone"
                    dataKey="mlForecast"
                    name="ML Forecast"
                    stroke="#F54927"
                    strokeWidth={3}
                    dot={false}
                    strokeOpacity={0.9}
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey="apparentForecast"
                  name="Føles som"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={false}
                  strokeOpacity={0.9}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Næste 16 timer</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {forecast.slice(0, 16).map((hour, index) => (
            <Card key={hour.timestamp} className={index === 0 ? "border-emerald-500 dark:border-emerald-500" : undefined}>
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">kl. {formatDanishTime(hour.timestamp)}</p>
                  <Badge variant={hour.effectiveTempSource === "ml" ? "default" : "secondary"}>
                    {getSourceLabel(hour.effectiveTempSource)}
                  </Badge>
                </div>
                <p className="my-1 text-xl font-bold">
                  {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)}°` : "—"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ML {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "ikke aktiv"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "ingen data"}
                </p>
                {hour.apparentTemp !== null && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Føles {Math.round(hour.apparentTemp)}°
                  </p>
                )}
                {index === 0 ? (
                  <Badge variant="outline" className="mt-2 border-emerald-500 text-emerald-600">
                    Nu
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
