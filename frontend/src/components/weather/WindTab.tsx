import { motion } from "framer-motion";
import { AlertTriangle, Navigation, Wind } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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

// Chart colors
const COLORS = {
  ml: "#3b82f6",
  dmi: "#f97316",
  actual: "#10b981",
  grid: "#334155",
};

function WindCompass({ direction, size = 84 }: { direction: number | null; size?: number }) {
  const label = getWindDirectionLabel(direction);
  const rotation = direction === null ? 0 : direction + 180;

  return (
    <div
      className="relative flex items-center justify-center rounded-full border-2 border-dashboard-border bg-dashboard-card"
      style={{ width: size, height: size }}
    >
      <span className="absolute top-1 text-[10px] font-bold text-dashboard-text-muted">N</span>
      <span className="absolute right-1 text-[10px] font-bold text-dashboard-text-muted">Ø</span>
      <span className="absolute bottom-1 text-[10px] font-bold text-dashboard-text-muted">S</span>
      <span className="absolute left-1 text-[10px] font-bold text-dashboard-text-muted">V</span>
      <motion.div animate={{ rotate: rotation }} transition={{ duration: 0.45, ease: "easeOut" }}>
        <Navigation className="h-8 w-8 text-dashboard-ml" fill="currentColor" />
      </motion.div>
      <span className="absolute bottom-4 text-[10px] font-medium text-dashboard-text-muted">{label}</span>
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
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-3 shadow-xl">
        <p className="mb-2 font-medium text-dashboard-text">{formatTooltipDateTime(label)}</p>
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-dashboard-text-muted">{entry.name}:</span>
            <span className="font-semibold text-dashboard-text">{entry.value?.toFixed?.(1) || entry.value} m/s</span>
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
        <Alert className="border-red-500 bg-red-500/10 text-red-200">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>{warning.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="dashboard-card-flat">
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge 
              variant={windStatus.hasActiveModel ? "default" : "secondary"}
              className={windStatus.hasActiveModel ? "bg-dashboard-ml" : "bg-dashboard-border"}
            >
              {windStatus.statusLabel}
            </Badge>
            <Badge 
              variant={gustStatus.hasActiveModel ? "default" : "secondary"}
              className={gustStatus.hasActiveModel ? "bg-dashboard-ml" : "bg-dashboard-border"}
            >
              Vindstød: {gustStatus.statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-dashboard-text-muted">{explanations.sources}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dashboard-card-flat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-dashboard-text-muted">Vindhastighed nu</p>
                <p className="mt-1 text-4xl font-bold text-dashboard-text">
                  {currentWind.effectiveWindSpeed !== null ? currentWind.effectiveWindSpeed.toFixed(1) : "—"}
                  <span className="ml-1 text-lg font-normal text-dashboard-text-muted">m/s</span>
                </p>
                <Badge 
                  variant={currentWind.effectiveWindSpeedSource === "ml" ? "default" : "secondary"} 
                  className={`mt-2 ${currentWind.effectiveWindSpeedSource === "ml" ? "bg-dashboard-ml" : "bg-dashboard-border"}`}
                >
                  {getSourceLabel(currentWind.effectiveWindSpeedSource)}
                </Badge>
                <p className="mt-2 text-sm text-dashboard-ml">
                  ML: {currentWind.mlWindSpeed !== null ? `${currentWind.mlWindSpeed.toFixed(1)} m/s` : "ikke aktiv"}
                </p>
                <p className="text-sm text-dashboard-dmi">
                  DMI: {currentWind.dmiWindSpeed !== null ? `${currentWind.dmiWindSpeed.toFixed(1)} m/s` : "ingen data"}
                </p>
              </div>
              <WindCompass direction={currentWind.windDirection} size={104} />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card-flat">
          <CardContent className="p-6">
            <p className="text-sm text-dashboard-text-muted">Vindstød</p>
            <p className="mt-1 text-4xl font-bold text-dashboard-text">
              {currentWind.effectiveWindGust !== null ? currentWind.effectiveWindGust.toFixed(1) : "—"}
              <span className="ml-1 text-lg font-normal text-dashboard-text-muted">m/s</span>
            </p>
            <Badge 
              variant={currentWind.effectiveWindGustSource === "ml" ? "default" : "secondary"}
              className={`mt-2 ${currentWind.effectiveWindGustSource === "ml" ? "bg-dashboard-ml" : "bg-dashboard-border"}`}
            >
              {getSourceLabel(currentWind.effectiveWindGustSource)}
            </Badge>
            <p className="mt-2 text-sm text-dashboard-ml">
              ML: {currentWind.mlWindGust !== null ? `${currentWind.mlWindGust.toFixed(1)} m/s` : "ikke aktiv"}
            </p>
            <p className="text-sm text-dashboard-dmi">
              DMI: {currentWind.dmiWindGust !== null ? `${currentWind.dmiWindGust.toFixed(1)} m/s` : "ingen data"}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card-flat">
          <CardContent className="p-6">
            <p className="text-sm text-dashboard-text-muted">Vindretning</p>
            <p className="mt-1 text-3xl font-bold text-dashboard-text">{getWindDirectionLabel(currentWind.windDirection)}</p>
            <p className="mt-1 text-sm text-dashboard-text-muted">
              {currentWind.windDirection !== null ? `${Math.round(currentWind.windDirection)}°` : "Ingen data"}
            </p>
            <p className="mt-3 text-sm text-dashboard-text-muted">
              Pilets retning viser hvorfra vinden kommer.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wind Speed Backtest Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-dashboard-text">
              <Wind className="h-5 w-5 text-dashboard-text-muted" />
              Vindhastighed backtest - sidste 7 dage
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
              <span className="legend-item"><span className="legend-dot bg-[#3b82f6]" /> ML</span>
              <span className="legend-item"><span className="legend-dot bg-[#10b981]" /> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData.filter((d) => d.actualSpeed !== null || d.dmiSpeedHistory !== null || d.mlSpeedHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="windMlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="windDmiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                {forecastBoundaryTimestamp ? (
                  <ReferenceLine
                    x={forecastBoundaryTimestamp}
                    stroke="#475569"
                    strokeWidth={2}
                    label={{ value: "Nu", position: "top", fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                  />
                ) : null}
                {showDmi ? (
                  <Area type="monotone" dataKey="dmiSpeedHistory" name="DMI Backtest" stroke={COLORS.dmi} strokeWidth={2} fill="url(#windDmiGradient)" dot={false} />
                ) : null}
                {showMlSpeed ? (
                  <Area type="monotone" dataKey="mlSpeedHistory" name="ML Backtest" stroke={COLORS.ml} strokeWidth={2} fill="url(#windMlGradient)" dot={false} />
                ) : null}
                {hasHistory ? (
                  <Line type="monotone" dataKey="actualSpeed" name="Faktisk vind" stroke={COLORS.actual} strokeWidth={2} dot={false} />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-dashboard-text-muted">
            Sammenligning af DMI&apos;s vindprognose, ML-modellen og faktisk målt vindhastighed de sidste 7 dage.
          </p>
        </CardContent>
      </Card>

      {/* Wind Speed Forecast Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-dashboard-text">
              <Wind className="h-5 w-5 text-dashboard-text-muted" />
              Vindhastighed forecast - næste 48 timer
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
              <span className="legend-item"><span className="legend-dot bg-[#3b82f6]" /> ML</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-dashboard-text-muted">
            Faktisk data kan først vises, når tiden er gået. Her ser du vores prognoser for fremtiden.
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData.filter((d) => d.dmiSpeedForecast !== null || d.mlSpeedForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="windForecastMlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="windForecastDmiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                {showDmi ? (
                  <Area
                    type="monotone"
                    dataKey="dmiSpeedForecast"
                    name="DMI Forecast"
                    stroke={COLORS.dmi}
                    strokeWidth={2}
                    fill="url(#windForecastDmiGradient)"
                    dot={false}
                  />
                ) : null}
                {showMlSpeed ? (
                  <Area
                    type="monotone"
                    dataKey="mlSpeedForecast"
                    name="ML Forecast"
                    stroke={COLORS.ml}
                    strokeWidth={2}
                    fill="url(#windForecastMlGradient)"
                    dot={false}
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {showGusts ? (
        <>
          {/* Wind Gust Backtest Chart */}
          <Card className="dashboard-card-flat">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-dashboard-text">
                  <Wind className="h-5 w-5 text-dashboard-text-muted" />
                  Vindstød backtest - sidste 7 dage
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
                  <span className="legend-item"><span className="legend-dot bg-[#3b82f6]" /> ML</span>
                  <span className="legend-item"><span className="legend-dot bg-[#10b981]" /> Faktisk</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData.filter((d) => d.actualGust !== null || d.dmiGustHistory !== null || d.mlGustHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gustMlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gustDmiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                    <XAxis {...sharedTimeAxisProps} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                    <Tooltip content={<CustomTooltip />} />
                    {forecastBoundaryTimestamp ? (
                      <ReferenceLine
                        x={forecastBoundaryTimestamp}
                        stroke="#475569"
                        strokeWidth={2}
                        label={{ value: "Nu", position: "top", fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                      />
                    ) : null}
                    {showDmi ? (
                      <Area type="monotone" dataKey="dmiGustHistory" name="DMI Backtest" stroke={COLORS.dmi} strokeWidth={2} fill="url(#gustDmiGradient)" dot={false} />
                    ) : null}
                    {showMlGust ? (
                      <Area type="monotone" dataKey="mlGustHistory" name="ML Backtest" stroke={COLORS.ml} strokeWidth={2} fill="url(#gustMlGradient)" dot={false} />
                    ) : null}
                    {hasHistory ? (
                      <Line type="monotone" dataKey="actualGust" name="Faktisk vindstød" stroke={COLORS.actual} strokeWidth={2} dot={false} />
                    ) : null}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Wind Gust Forecast Chart */}
          <Card className="dashboard-card-flat">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-dashboard-text">
                  <Wind className="h-5 w-5 text-dashboard-text-muted" />
                  Vindstød forecast - næste 48 timer
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
                  <span className="legend-item"><span className="legend-dot bg-[#3b82f6]" /> ML</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-dashboard-text-muted">
                Faktisk data kan først vises, når tiden er gået. Her ser du vores prognoser for fremtiden.
              </p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData.filter((d) => d.dmiGustForecast !== null || d.mlGustForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gustForecastMlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gustForecastDmiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                    <XAxis {...sharedTimeAxisProps} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                    <Tooltip content={<CustomTooltip />} />
                    {showDmi ? (
                      <Area
                        type="monotone"
                        dataKey="dmiGustForecast"
                        name="DMI Forecast"
                        stroke={COLORS.dmi}
                        strokeWidth={2}
                        fill="url(#gustForecastDmiGradient)"
                        dot={false}
                      />
                    ) : null}
                    {showMlGust ? (
                      <Area
                        type="monotone"
                        dataKey="mlGustForecast"
                        name="ML Forecast"
                        stroke={COLORS.ml}
                        strokeWidth={2}
                        fill="url(#gustForecastMlGradient)"
                        dot={false}
                      />
                    ) : null}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Wind Direction Cards */}
      <Card className="dashboard-card-flat">
        <CardHeader>
          <CardTitle className="text-base text-dashboard-text">Vindretning de næste 12 timer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {forecast.slice(0, 12).map((hour) => (
            <div key={hour.timestamp} className="flex flex-col items-center">
              <WindCompass direction={hour.windDirection} size={64} />
              <span className="mt-1 text-xs text-dashboard-text-muted">kl. {formatDanishTime(hour.timestamp)}</span>
              <Badge 
                variant={hour.effectiveWindSpeedSource === "ml" ? "default" : "secondary"}
                className={`mt-1 ${hour.effectiveWindSpeedSource === "ml" ? "bg-dashboard-ml" : "bg-dashboard-border"}`}
              >
                {getSourceLabel(hour.effectiveWindSpeedSource)}
              </Badge>
              <span className="mt-1 text-xs font-medium text-dashboard-text">
                {hour.effectiveWindSpeed !== null ? `${hour.effectiveWindSpeed.toFixed(0)} m/s` : "—"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
