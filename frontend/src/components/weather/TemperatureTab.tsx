import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatShortDate, getSourceLabel } from "@/lib/weather";
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
  time: string;
  actual: number | null;
  dmiHistory: number | null;
  mlHistory: number | null;
  dmiForecast: number | null;
  mlForecast: number | null;
  apparentForecast: number | null;
  hour: number | null;
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
  const [showDmi, setShowDmi] = useState(true);
  const [showMl, setShowMl] = useState(hasMlSeries);
  const [showApparent, setShowApparent] = useState(true);

  const timelineData: TemperatureTimelinePoint[] = [
    ...history.map((point) => ({
      time: formatShortDate(point.timestamp),
      actual: point.actualTemp,
      dmiHistory: point.dmiTemp,
      mlHistory: point.mlTemp,
      dmiForecast: null,
      mlForecast: null,
      apparentForecast: null,
      hour: null,
    })),
    ...forecast.map((point) => ({
      time: formatShortDate(point.timestamp),
      actual: null,
      dmiHistory: null,
      mlHistory: null,
      dmiForecast: point.dmiTemp,
      mlForecast: hasMlSeries ? point.mlTemp : null,
      apparentForecast: point.apparentTemp,
      hour: point.hour,
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
  const forecastBoundaryLabel = forecast[0] ? formatShortDate(forecast[0].timestamp) : null;

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
        <p className="mb-2 font-medium">{label}</p>
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
              : "Temperaturmodellen evalueres loebende"}
          </div>
          <Badge variant="secondary">
            {avgDiff !== null ? `Typisk forskel: ${avgDiff.toFixed(2)}°C` : "Ingen aktiv ML-forskel endnu"}
          </Badge>
          <Badge variant="outline">
            {maxDiff !== null ? `Stoerste forskel: ${maxDiff.toFixed(1)}°C` : "Ingen stoerste forskel endnu"}
          </Badge>
        </div>
        <TooltipProvider>
          <UiTooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
                <Info className="h-4 w-4" />
                Saadan laeser du grafen
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              Sort streg viser det faktiske vejr de seneste 7 dage. Faste farvede linjer viser hvordan prognoserne så ud. Stiplede linjer viser de kommende 48 timer.
            </TooltipContent>
          </UiTooltip>
        </TooltipProvider>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-slate-500" />
              Sidste 7 dage + naeste 48 timer
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="temp-dmi" checked={showDmi} onCheckedChange={setShowDmi} />
                <Label htmlFor="temp-dmi">DMI</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="temp-ml" checked={showMl} onCheckedChange={setShowMl} disabled={!hasMlSeries} />
                <Label htmlFor="temp-ml">ML</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="temp-apparent" checked={showApparent} onCheckedChange={setShowApparent} />
                <Label htmlFor="temp-apparent">Foeles som</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}°`} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip content={<CustomTooltip />} />
                {forecastBoundaryLabel ? (
                  <ReferenceLine
                    x={forecastBoundaryLabel}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    label={{ value: "Nu / forecast", position: "top", fontSize: 10, fill: "currentColor" }}
                  />
                ) : null}
                {hasHistory ? (
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="#111827" strokeWidth={2} dot={false} />
                ) : null}
                {showDmi ? (
                  <>
                    <Line type="monotone" dataKey="dmiHistory" name="DMI Backtest" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="dmiForecast"
                      name="DMI Forecast"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </>
                ) : null}
                {showMl && hasMlSeries ? (
                  <>
                    <Line type="monotone" dataKey="mlHistory" name="ML Backtest" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="mlForecast"
                      name="ML Forecast"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </>
                ) : null}
                {showApparent ? (
                  <Line
                    type="monotone"
                    dataKey="apparentForecast"
                    name="Foeles som"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Naeste 16 timer</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {forecast.slice(0, 16).map((hour, index) => (
            <Card key={hour.timestamp} className={index === 0 ? "border-emerald-500 dark:border-emerald-500" : undefined}>
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{hour.hour}:00</p>
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Foeles {hour.apparentTemp !== null ? `${Math.round(hour.apparentTemp)}°` : "—"}
                </p>
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
