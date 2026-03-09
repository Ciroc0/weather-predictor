import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Navigation, Wind } from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  formatShortDate,
  getSourceLabel,
  getWindDirectionLabel,
} from "@/lib/weather";
import type {
  DashboardExplanations,
  TargetStatus,
  WeatherAlert,
  WeatherForecast,
} from "@/types/weather";

interface WindTabProps {
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
  windStatus: TargetStatus;
  gustStatus: TargetStatus;
  explanations: DashboardExplanations;
}

interface WindChartPoint {
  time: string;
  dmiSpeed: number | null;
  mlSpeed: number | null;
  dmiGust: number | null;
  mlGust: number | null;
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

function WindCompass({ direction, size = 84 }: { direction: number | null; size?: number }) {
  const label = getWindDirectionLabel(direction);
  const rotation = direction === null ? 0 : direction + 180;

  return (
    <div
      className="relative flex items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
      style={{ width: size, height: size }}
    >
      <span className="absolute top-1 text-[10px] font-bold text-slate-400">N</span>
      <span className="absolute right-1 text-[10px] font-bold text-slate-400">O</span>
      <span className="absolute bottom-1 text-[10px] font-bold text-slate-400">S</span>
      <span className="absolute left-1 text-[10px] font-bold text-slate-400">V</span>
      <motion.div animate={{ rotate: rotation }} transition={{ duration: 0.45, ease: "easeOut" }}>
        <Navigation className="h-8 w-8 text-sky-500" fill="currentColor" />
      </motion.div>
      <span className="absolute bottom-4 text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

export function WindTab({
  forecast,
  alerts,
  windStatus,
  gustStatus,
  explanations,
}: WindTabProps) {
  const hasMlSpeed = windStatus.hasActiveModel && forecast.some((point) => point.mlWindSpeed !== null);
  const hasMlGust = gustStatus.hasActiveModel && forecast.some((point) => point.mlWindGust !== null);
  const [showDmi, setShowDmi] = useState(true);
  const [showMl, setShowMl] = useState(hasMlSpeed);
  const [showGusts, setShowGusts] = useState(true);

  const chartData: WindChartPoint[] = forecast.map((point) => ({
    time: formatShortDate(point.timestamp),
    dmiSpeed: point.dmiWindSpeed,
    mlSpeed: hasMlSpeed ? point.mlWindSpeed : null,
    dmiGust: point.dmiWindGust,
    mlGust: hasMlGust ? point.mlWindGust : null,
  }));

  const warning = alerts.find((alert) => alert.type === "wind");
  const currentWind = forecast[0];

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
            <span className="font-semibold">{entry.value.toFixed(1)} m/s</span>
          </div>
        ))}
      </div>
    );
  };

  if (!currentWind) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {warning ? (
        <Alert className="border-red-500 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-200">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>{warning.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={windStatus.hasActiveModel ? "default" : "secondary"}>
              {windStatus.statusLabel}
            </Badge>
            <Badge variant={gustStatus.hasActiveModel ? "default" : "secondary"}>
              Vindstoed: {gustStatus.statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{explanations.sources}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Vindhastighed nu</p>
                <p className="mt-1 text-4xl font-bold">
                  {currentWind.effectiveWindSpeed !== null ? currentWind.effectiveWindSpeed.toFixed(1) : "—"}
                  <span className="ml-1 text-lg font-normal text-slate-500">m/s</span>
                </p>
                <Badge variant={currentWind.effectiveWindSpeedSource === "ml" ? "default" : "secondary"} className="mt-2">
                  {getSourceLabel(currentWind.effectiveWindSpeedSource)}
                </Badge>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  ML: {currentWind.mlWindSpeed !== null ? `${currentWind.mlWindSpeed.toFixed(1)} m/s` : "ikke aktiv"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  DMI: {currentWind.dmiWindSpeed !== null ? `${currentWind.dmiWindSpeed.toFixed(1)} m/s` : "ingen data"}
                </p>
              </div>
              <WindCompass direction={currentWind.windDirection} size={104} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Vindstoed</p>
            <p className="mt-1 text-4xl font-bold">
              {currentWind.effectiveWindGust !== null ? currentWind.effectiveWindGust.toFixed(1) : "—"}
              <span className="ml-1 text-lg font-normal text-slate-500">m/s</span>
            </p>
            <Badge variant={currentWind.effectiveWindGustSource === "ml" ? "default" : "secondary"} className="mt-2">
              {getSourceLabel(currentWind.effectiveWindGustSource)}
            </Badge>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              ML: {currentWind.mlWindGust !== null ? `${currentWind.mlWindGust.toFixed(1)} m/s` : "ikke aktiv"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              DMI: {currentWind.dmiWindGust !== null ? `${currentWind.dmiWindGust.toFixed(1)} m/s` : "ingen data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Vindretning</p>
            <p className="mt-1 text-3xl font-bold">{getWindDirectionLabel(currentWind.windDirection)}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {currentWind.windDirection !== null ? `${Math.round(currentWind.windDirection)}°` : "Ingen data"}
            </p>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Retningen viser, hvor vinden kommer fra i prognosen.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-slate-500" />
              48-timers vindprognose
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="wind-dmi" checked={showDmi} onCheckedChange={setShowDmi} />
                <Label htmlFor="wind-dmi">DMI hastighed</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="wind-ml" checked={showMl} onCheckedChange={setShowMl} disabled={!hasMlSpeed} />
                <Label htmlFor="wind-ml">ML hastighed</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="wind-gusts" checked={showGusts} onCheckedChange={setShowGusts} />
                <Label htmlFor="wind-gusts">Vindstoed</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                {showDmi ? <Line type="monotone" dataKey="dmiSpeed" name="DMI vind" stroke="#3b82f6" strokeWidth={2} dot={false} /> : null}
                {showMl && hasMlSpeed ? <Line type="monotone" dataKey="mlSpeed" name="ML vind" stroke="#10b981" strokeWidth={2} dot={false} /> : null}
                {showGusts ? (
                  <>
                    <Line type="monotone" dataKey="dmiGust" name="DMI vindstoed" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    {hasMlGust ? (
                      <Line type="monotone" dataKey="mlGust" name="ML vindstoed" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                    ) : null}
                  </>
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vindretning de naeste 12 timer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {forecast.slice(0, 12).map((hour) => (
            <div key={hour.timestamp} className="flex flex-col items-center">
              <WindCompass direction={hour.windDirection} size={64} />
              <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hour.hour}:00</span>
              <Badge variant={hour.effectiveWindSpeedSource === "ml" ? "default" : "secondary"} className="mt-1">
                {getSourceLabel(hour.effectiveWindSpeedSource)}
              </Badge>
              <span className="mt-1 text-xs font-medium">
                {hour.effectiveWindSpeed !== null ? `${hour.effectiveWindSpeed.toFixed(0)} m/s` : "—"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
