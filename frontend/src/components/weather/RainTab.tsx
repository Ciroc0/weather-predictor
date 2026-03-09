import { motion } from "framer-motion";
import { Cloud, CloudRain, Droplets, Info, Sun, Umbrella } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatShortDate } from "@/lib/weather";
import type { WeatherAlert, WeatherForecast } from "@/types/weather";

interface RainTabProps {
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
}

interface RainChartPoint {
  time: string;
  dmiProb: number;
  mlProb: number;
  dmiAmount: number;
  mlAmount: number;
}

interface TooltipPayloadItem {
  color: string;
  dataKey?: string;
  name: string;
  value: number;
}

export function RainTab({ forecast, alerts }: RainTabProps) {
  const currentRain = forecast[0];
  const chartData: RainChartPoint[] = forecast.map((point) => ({
    time: formatShortDate(point.timestamp),
    dmiProb: point.dmiRainProb,
    mlProb: point.mlRainProb,
    dmiAmount: point.dmiRainAmount,
    mlAmount: point.mlRainAmount,
  }));

  const rainAlert = alerts.find((alert) => alert.type === "rain");
  const dryPeriods = forecast
    .reduce<{ start: number; end: number; hours: number }[]>((periods, point, index, all) => {
      const isDry = point.mlRainProb < 20;
      const previous = all[index - 1];
      const previousDry = previous ? previous.mlRainProb < 20 : false;
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
              {entry.dataKey?.toLowerCase().includes("prob") ? `${entry.value.toFixed(0)}%` : `${entry.value.toFixed(1)} mm`}
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={currentRain.mlRainProb > 50 ? "border-blue-300 dark:border-blue-800" : undefined}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Nedbør lige nu</p>
            <div className="mt-2 flex items-center gap-2">
              {currentRain.mlRainProb > 50 ? <CloudRain className="h-6 w-6 text-blue-500" /> : <Sun className="h-6 w-6 text-amber-500" />}
              <span className="text-2xl font-bold">{currentRain.mlRainProb > 50 ? "Regn i sigte" : "Tørt lige nu"}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {currentRain.mlRainAmount > 0 ? `${currentRain.mlRainAmount.toFixed(1)} mm` : "Ingen målbar nedbør"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Næste 24 timer</p>
            <div className="mt-2 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-sky-500" />
              <span className="text-xl font-bold">
                {forecast.slice(0, 24).reduce((sum, point) => sum + point.mlRainAmount, 0).toFixed(1)} mm
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Næste 48 timer</p>
            <div className="mt-2 flex items-center gap-2">
              <Umbrella className="h-5 w-5 text-slate-500" />
              <span className="text-xl font-bold">
                {forecast.reduce((sum, point) => sum + point.mlRainAmount, 0).toFixed(1)} mm
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {forecast.filter((point) => point.mlRainProb >= 50).length} timer med høj regnrisiko
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-slate-500" />
              Nedbørssandsynlighed
            </CardTitle>
            <TooltipProvider>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>ML estimerer sandsynlighed og mængde separat for hvert lead-bucket.</TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mlProb" name="ML sandsynlighed" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`${entry.time}-${index}`}
                      fill={entry.mlProb > 60 ? "#2563eb" : entry.mlProb > 30 ? "#3b82f6" : "#93c5fd"}
                    />
                  ))}
                </Bar>
                <Line type="stepAfter" dataKey="dmiProb" name="DMI sandsynlighed" stroke="#64748b" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-slate-500" />
            Nedbørsmængde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mlAmount" name="ML mængde" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                <Bar dataKey="dmiAmount" name="DMI mængde" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {dryPeriods.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-4 w-4 text-amber-500" />
              Mulige tørvejrsperioder
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
                      {forecast[period.start]?.hour}:00 - {forecast[period.end]?.hour}:00
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {forecast[period.start] ? formatShortDate(forecast[period.start].timestamp) : "Ukendt"}
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
