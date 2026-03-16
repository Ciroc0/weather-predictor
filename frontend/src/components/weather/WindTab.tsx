import { motion } from "framer-motion";
import { AlertTriangle, Navigation, Wind } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sharedTimeAxisProps } from "@/lib/chart";
import {
  formatDanishTime,
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

function WindCompass({ direction, size = 84 }: { direction: number | null; size?: number }) {
  const label = getWindDirectionLabel(direction);
  const rotation = direction === null ? 0 : direction + 180;

  return (
    <div
      className="relative flex items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
      style={{ width: size, height: size }}
    >
      <span className="absolute top-1 text-[10px] font-bold text-slate-400">N</span>
      <span className="absolute right-1 text-[10px] font-bold text-slate-400">Ø</span>
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
  history,
  alerts,
  windStatus,
  gustStatus,
  explanations,
}: WindTabProps) {
  const hasMlSpeed = windStatus.hasActiveModel && forecast.some((point) => point.mlWindSpeed !== null);
  const hasMlGust = gustStatus.hasActiveModel && forecast.some((point) => point.mlWindGust !== null);
  const hasHistory = history.length > 0;
  const showDmi = true;
  const showMlSpeed = hasMlSpeed;
  const showMlGust = hasMlGust;
  const showGusts = true;

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
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 font-medium">{formatTooltipDateTime(label)}</p>
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
              Vindstød: {gustStatus.statusLabel}
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Vindstød</p>
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
              Pilets retning viser hvorfra vinden kommer.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-slate-500" />
              Vindhastighed backtest - sidste 7 dage
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#27D6F5]" /> DMI</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#F54927]" /> ML</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#0B2EF4]" /> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter((d) => d.actualSpeed !== null || d.dmiSpeedHistory !== null || d.mlSpeedHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis {...sharedTimeAxisProps} />
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
                {showDmi ? (
                  <Line type="monotone" dataKey="dmiSpeedHistory" name="DMI Backtest" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                ) : null}
                {showMlSpeed ? (
                  <Line type="monotone" dataKey="mlSpeedHistory" name="ML Backtest" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                ) : null}
                {hasHistory ? (
                  <Line type="monotone" dataKey="actualSpeed" name="Faktisk vind" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Sammenligning af DMI&apos;s vindprognose, ML-modellen og faktisk målt vindhastighed de sidste 7 dage.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-slate-500" />
              Vindhastighed forecast - næste 48 timer
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#27D6F5]" /> DMI</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#F54927]" /> ML</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Faktisk data kan først vises, når tiden er gået. Her ser du vores prognoser for fremtiden.
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter((d) => d.dmiSpeedForecast !== null || d.mlSpeedForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
                <Tooltip content={<CustomTooltip />} />
                {showDmi ? (
                  <Line
                    type="monotone"
                    dataKey="dmiSpeedForecast"
                    name="DMI Forecast"
                    stroke="#27D6F5"
                    strokeWidth={3}
                    dot={false}
                    strokeOpacity={0.9}
                  />
                ) : null}
                {showMlSpeed ? (
                  <Line
                    type="monotone"
                    dataKey="mlSpeedForecast"
                    name="ML Forecast"
                    stroke="#F54927"
                    strokeWidth={3}
                    dot={false}
                    strokeOpacity={0.9}
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {showGusts ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-slate-500" />
                  Vindstød backtest - sidste 7 dage
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#27D6F5]" /> DMI</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#F54927]" /> ML</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#0B2EF4]" /> Faktisk</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData.filter((d) => d.actualGust !== null || d.dmiGustHistory !== null || d.mlGustHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                    <XAxis {...sharedTimeAxisProps} />
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
                    {showDmi ? (
                      <Line type="monotone" dataKey="dmiGustHistory" name="DMI Backtest" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                    ) : null}
                    {showMlGust ? (
                      <Line type="monotone" dataKey="mlGustHistory" name="ML Backtest" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                    ) : null}
                    {hasHistory ? (
                      <Line type="monotone" dataKey="actualGust" name="Faktisk vindstød" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.9} />
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-slate-500" />
                  Vindstød forecast - næste 48 timer
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#27D6F5]" /> DMI</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[#F54927]" /> ML</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                Faktisk data kan først vises, når tiden er gået. Her ser du vores prognoser for fremtiden.
              </p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData.filter((d) => d.dmiGustForecast !== null || d.mlGustForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                    <XAxis {...sharedTimeAxisProps} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
                    <Tooltip content={<CustomTooltip />} />
                    {showDmi ? (
                      <Line
                        type="monotone"
                        dataKey="dmiGustForecast"
                        name="DMI Forecast"
                        stroke="#27D6F5"
                        strokeWidth={3}
                        dot={false}
                        strokeOpacity={0.9}
                      />
                    ) : null}
                    {showMlGust ? (
                      <Line
                        type="monotone"
                        dataKey="mlGustForecast"
                        name="ML Forecast"
                        stroke="#F54927"
                        strokeWidth={3}
                        dot={false}
                        strokeOpacity={0.9}
                      />
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vindretning de næste 12 timer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {forecast.slice(0, 12).map((hour) => (
            <div key={hour.timestamp} className="flex flex-col items-center">
              <WindCompass direction={hour.windDirection} size={64} />
              <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">kl. {formatDanishTime(hour.timestamp)}</span>
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
