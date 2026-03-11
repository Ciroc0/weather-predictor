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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDanishTime, formatShortDate, getSourceLabel } from "@/lib/weather";
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
  time: string;
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

export function RainTab({
  forecast,
  history,
  alerts,
  rainEventStatus,
  rainAmountStatus,
  explanations,
}: RainTabProps) {
  const currentRain = forecast[0];
  const hasHistory = history.length > 0;

  const timelineData: RainTimelinePoint[] = [
    ...history.map((point) => ({
      time: formatShortDate(point.timestamp),
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
      time: formatShortDate(point.hour),
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
  const forecastBoundaryLabel = forecast[0] ? formatShortDate(forecast[0].hour) : null;
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
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 font-medium">{label}</p>
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
    );
  };

  if (!currentRain) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {rainAlert ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
          <strong>{rainAlert.title}:</strong> {rainAlert.message}
        </div>
      ) : null}

      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={rainEventStatus.hasActiveModel ? "default" : "secondary"}>
              Regnrisiko: {rainEventStatus.statusLabel}
            </Badge>
            <Badge variant={rainAmountStatus.hasActiveModel ? "default" : "secondary"}>
              Regnmængde: {rainAmountStatus.statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{explanations.sources}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={currentRain.effectiveRainProb > 50 ? "border-blue-300 dark:border-blue-800" : undefined}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Regnrisiko lige nu</p>
            <div className="mt-2 flex items-center gap-2">
              {currentRain.effectiveRainProb > 50 ? <CloudRain className="h-6 w-6 text-blue-500" /> : <Sun className="h-6 w-6 text-amber-500" />}
              <span className="text-2xl font-bold">{currentRain.effectiveRainProb > 50 ? "Regn i sigte" : "Tørt lige nu"}</span>
            </div>
            <Badge variant={currentRain.effectiveRainProbSource === "ml" ? "default" : "secondary"} className="mt-3">
              {getSourceLabel(currentRain.effectiveRainProbSource)}
            </Badge>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              ML: {currentRain.mlRainProb.toFixed(0)}% • DMI: {currentRain.dmiRainProb.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Næste 24 timer</p>
            <div className="mt-2 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-sky-500" />
              <span className="text-xl font-bold">
                {forecast.slice(0, 24).reduce((sum, point) => sum + point.effectiveRainAmount, 0).toFixed(1)} mm
              </span>
            </div>
            <Badge variant={currentRain.effectiveRainAmountSource === "ml" ? "default" : "secondary"} className="mt-3">
              {getSourceLabel(currentRain.effectiveRainAmountSource)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Næste 48 timer</p>
            <div className="mt-2 flex items-center gap-2">
              <Umbrella className="h-5 w-5 text-slate-500" />
              <span className="text-xl font-bold">
                {forecast.reduce((sum, point) => sum + point.effectiveRainAmount, 0).toFixed(1)} mm
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {forecast.filter((point) => point.effectiveRainProb >= 50).length} timer med høj regnrisiko
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rain Probability Backtest */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-slate-500" />
              Regnrisiko backtest - Sidste 7 dage
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-500"></span> DMI</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500"></span> ML</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-violet-500"></span> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter(d => d.actualProb !== null || d.dmiProbHistory !== null || d.mlProbHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CustomTooltip />} />
                {forecastBoundaryLabel ? (
                  <ReferenceLine
                    x={forecastBoundaryLabel}
                    stroke="#475569"
                    strokeWidth={2}
                    label={{ value: "Nu", position: "top", fontSize: 11, fill: "#475569", fontWeight: 600 }}
                  />
                ) : null}
                {hasHistory ? (
                  <Bar dataKey="actualProb" name="Faktisk regn" fill="#64748b" radius={[3, 3, 0, 0]} />
                ) : null}
                <Line type="monotone" dataKey="dmiProbHistory" name="DMI Backtest" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mlProbHistory" name="ML Backtest" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rain Probability Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-slate-500" />
              Regnrisiko forecast - Næste 48 timer
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-500"></span> DMI</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500"></span> ML</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Faktisk data kan først vises når tiden er gået — her ser du vores prognoser for fremtiden.
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter(d => d.dmiProbForecast !== null || d.mlProbForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={3} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="dmiProbForecast"
                  name="DMI Forecast"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mlProbForecast"
                  name="ML Forecast"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rain Amount Backtest */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-slate-500" />
              Regnmængde backtest - Sidste 7 dage
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500"></span> DMI</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-sky-500"></span> ML</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-violet-400"></span> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">{rainAmountStatus.statusDescription}</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter(d => d.actualAmount !== null || d.dmiAmountHistory !== null || d.mlAmountHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                {forecastBoundaryLabel ? (
                  <ReferenceLine
                    x={forecastBoundaryLabel}
                    stroke="#475569"
                    strokeWidth={2}
                    label={{ value: "Nu", position: "top", fontSize: 11, fill: "#475569", fontWeight: 600 }}
                  />
                ) : null}
                {hasHistory ? (
                  <Bar dataKey="actualAmount" name="Faktisk regnmængde" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
                ) : null}
                <Line type="monotone" dataKey="dmiAmountHistory" name="DMI Backtest" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mlAmountHistory" name="ML Backtest" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rain Amount Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-slate-500" />
              Regnmængde forecast - Næste 48 timer
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500"></span> DMI</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-sky-500"></span> ML</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Faktisk data kan først vises når tiden er gået — her ser du vores prognoser for fremtiden.
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter(d => d.dmiAmountForecast !== null || d.mlAmountForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={3} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="dmiAmountForecast"
                  name="DMI Forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mlAmountForecast"
                  name="ML Forecast"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {dryPeriods.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-4 w-4 text-amber-500" />
              Mulige tørre perioder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dryPeriods.map((period) => (
              <div
                key={`${period.start}-${period.end}`}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Cloud className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">
                      kl. {formatDanishTime(forecast[period.start]?.hour)} - kl. {formatDanishTime(forecast[period.end]?.hour)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {forecast[period.start] ? formatShortDate(forecast[period.start].hour) : "Ukendt"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{period.hours} timer</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </motion.div>
  );
}
