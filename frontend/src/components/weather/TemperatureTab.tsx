import { useState } from "react";
import { motion } from "framer-motion";
import { Info, Thermometer, TrendingDown } from "lucide-react";
import {
  Area,
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
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatShortDate } from "@/lib/weather";
import type { VerificationMetrics, WeatherForecast } from "@/types/weather";

interface TemperatureTabProps {
  forecast: WeatherForecast[];
  verification: VerificationMetrics;
}

interface TemperatureChartPoint {
  time: string;
  dmi: number | null;
  ml: number | null;
  apparent: number | null;
  hour: number;
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

export function TemperatureTab({ forecast, verification }: TemperatureTabProps) {
  const [showDmi, setShowDmi] = useState(true);
  const [showMl, setShowMl] = useState(true);
  const [showApparent, setShowApparent] = useState(true);

  const chartData: TemperatureChartPoint[] = forecast.map((point) => ({
    time: formatShortDate(point.timestamp),
    dmi: point.dmiTemp,
    ml: point.mlTemp,
    apparent: point.apparentTemp,
    hour: point.hour,
  }));

  const differences = forecast
    .map((point) =>
      point.dmiTemp !== null && point.mlTemp !== null ? Math.abs(point.dmiTemp - point.mlTemp) : null,
    )
    .filter((value): value is number => value !== null);
  const avgDiff = differences.length > 0 ? differences.reduce((sum, value) => sum + value, 0) / differences.length : null;
  const maxDiff = differences.length > 0 ? Math.max(...differences) : null;
  const nextDayIndex = forecast.findIndex((point, index) => index > 0 && point.hour === 0);

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            <TrendingDown className="h-4 w-4" />
            {improvement !== null ? `Temperatur-RMSE ${improvement.toFixed(1)}% bedre end DMI` : "Temperatur-modellen evalueres løbende"}
          </div>
          <Badge variant="secondary">
            {avgDiff !== null ? `Gennemsnitlig forskel: ${avgDiff.toFixed(2)}°C` : "Ingen forskelsdata"}
          </Badge>
          <Badge variant="outline">
            {maxDiff !== null ? `Maks forskel: ${maxDiff.toFixed(1)}°C` : "Ingen maksdata"}
          </Badge>
        </div>
        <TooltipProvider>
          <UiTooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
                <Info className="h-4 w-4" />
                Hvad gør ML-laget?
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              ML-laget justerer DMI's temperaturprognose med historiske Aarhus-data og lead-bucket-specifikke modeller.
            </TooltipContent>
          </UiTooltip>
        </TooltipProvider>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-slate-500" />
              48-timers temperaturprognose
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="temp-dmi" checked={showDmi} onCheckedChange={setShowDmi} />
                <Label htmlFor="temp-dmi">DMI</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="temp-ml" checked={showMl} onCheckedChange={setShowMl} />
                <Label htmlFor="temp-ml">ML</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="temp-apparent" checked={showApparent} onCheckedChange={setShowApparent} />
                <Label htmlFor="temp-apparent">Føles som</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="temp-dmi-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="temp-ml-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}°`} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip content={<CustomTooltip />} />
                {nextDayIndex > 0 ? (
                  <ReferenceLine
                    x={chartData[nextDayIndex]?.time}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    label={{ value: "Næste døgn", position: "top", fontSize: 10, fill: "currentColor" }}
                  />
                ) : null}
                {showDmi ? (
                  <>
                    <Area type="monotone" dataKey="dmi" fill="url(#temp-dmi-gradient)" stroke="transparent" />
                    <Line type="monotone" dataKey="dmi" name="DMI" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </>
                ) : null}
                {showMl ? (
                  <>
                    <Area type="monotone" dataKey="ml" fill="url(#temp-ml-gradient)" stroke="transparent" />
                    <Line type="monotone" dataKey="ml" name="ML" stroke="#10b981" strokeWidth={2} dot={false} />
                  </>
                ) : null}
                {showApparent ? (
                  <Line
                    type="monotone"
                    dataKey="apparent"
                    name="Føles som"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Time for time</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {forecast.slice(0, 16).map((hour, index) => (
            <Card key={hour.timestamp} className={index === 0 ? "border-emerald-500 dark:border-emerald-500" : undefined}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">{hour.hour}:00</p>
                <p className="my-1 text-xl font-bold">{hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "—"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "—"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Føles {hour.apparentTemp !== null ? `${Math.round(hour.apparentTemp)}°` : "—"}
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
