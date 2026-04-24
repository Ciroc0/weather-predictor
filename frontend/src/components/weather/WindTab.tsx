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

const COLORS = {
  ml: "#06b6d4",
  dmi: "#f97316",
  actual: "#22c55e",
  grid: "rgba(255,255,255,0.04)",
};

function WindCompass({ direction, size = 84 }: { direction: number | null; size?: number }) {
  const label = getWindDirectionLabel(direction);
  const rotation = direction === null ? 0 : direction + 180;

  return (
    <div
      className="relative flex items-center justify-center rounded-full border-2 border-white/[0.08] bg-white/[0.03]"
      style={{ width: size, height: size }}
    >
      <span className="absolute top-1 text-[10px] font-bold text-aether-text-tertiary">N</span>
      <span className="absolute right-1 text-[10px] font-bold text-aether-text-tertiary">Ø</span>
      <span className="absolute bottom-1 text-[10px] font-bold text-aether-text-tertiary">S</span>
      <span className="absolute left-1 text-[10px] font-bold text-aether-text-tertiary">V</span>
      <motion.div animate={{ rotate: rotation }} transition={{ duration: 0.45, ease: "easeOut" }}>
        <Navigation className="h-8 w-8 text-cyan-400" fill="currentColor" />
      </motion.div>
      <span className="absolute bottom-4 text-[10px] font-medium text-aether-text-tertiary">{label}</span>
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
      <div className="rounded-xl border border-white/[0.12] bg-[#0f172a]/95 backdrop-blur-xl p-3 shadow-2xl">
        <p className="mb-2 font-medium text-white text-sm">{formatTooltipDateTime(label)}</p>
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-aether-text-secondary">{entry.name}:</span>
            <span className="font-semibold text-white">{entry.value?.toFixed?.(1) || entry.value} m/s</span>
          </div>
        ))}
      </div>
    );
  };

  if (!currentWind) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      {warning ? (
        <Alert className="border-rose-500/30 bg-rose-500/10 text-rose-200">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>{warning.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={windStatus.hasActiveModel
              ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
              : "border-white/[0.08] text-aether-text-secondary bg-white/[0.03]"
            }
          >
            {windStatus.statusLabel}
          </Badge>
          <Badge
            variant="outline"
            className={gustStatus.hasActiveModel
              ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
              : "border-white/[0.08] text-aether-text-secondary bg-white/[0.03]"
            }
          >
            Vindstød: {gustStatus.statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-aether-text-secondary mt-2">{explanations.sources}</p>
      </div>

      {/* Current Wind Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">Vindhastighed nu</p>
              <p className="text-4xl font-bold text-white">
                {currentWind.effectiveWindSpeed !== null ? currentWind.effectiveWindSpeed.toFixed(1) : "—"}
                <span className="ml-1 text-lg font-normal text-aether-text-secondary">m/s</span>
              </p>
              <Badge
                variant="outline"
                className={`mt-3 text-[10px] ${
                  currentWind.effectiveWindSpeedSource === "ml"
                    ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
                    : "border-coral/30 text-coral bg-coral/10"
                }`}
              >
                {getSourceLabel(currentWind.effectiveWindSpeedSource)}
              </Badge>
              <div className="mt-3 space-y-1 text-xs">
                <p className="text-cyan-400">ML: {currentWind.mlWindSpeed !== null ? `${currentWind.mlWindSpeed.toFixed(1)} m/s` : "ikke aktiv"}</p>
                <p className="text-coral">DMI: {currentWind.dmiWindSpeed !== null ? `${currentWind.dmiWindSpeed.toFixed(1)} m/s` : "ingen data"}</p>
              </div>
            </div>
            <WindCompass direction={currentWind.windDirection} size={104} />
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">Vindstød</p>
          <p className="text-4xl font-bold text-white">
            {currentWind.effectiveWindGust !== null ? currentWind.effectiveWindGust.toFixed(1) : "—"}
            <span className="ml-1 text-lg font-normal text-aether-text-secondary">m/s</span>
          </p>
          <Badge
            variant="outline"
            className={`mt-3 text-[10px] ${
              currentWind.effectiveWindGustSource === "ml"
                ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
                : "border-coral/30 text-coral bg-coral/10"
            }`}
          >
            {getSourceLabel(currentWind.effectiveWindGustSource)}
          </Badge>
          <div className="mt-3 space-y-1 text-xs">
            <p className="text-cyan-400">ML: {currentWind.mlWindGust !== null ? `${currentWind.mlWindGust.toFixed(1)} m/s` : "ikke aktiv"}</p>
            <p className="text-coral">DMI: {currentWind.dmiWindGust !== null ? `${currentWind.dmiWindGust.toFixed(1)} m/s` : "ingen data"}</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">Vindretning</p>
          <p className="text-3xl font-bold text-white">{getWindDirectionLabel(currentWind.windDirection)}</p>
          <p className="text-sm text-aether-text-secondary mt-1">
            {currentWind.windDirection !== null ? `${Math.round(currentWind.windDirection)}°` : "Ingen data"}
          </p>
          <p className="mt-4 text-xs text-aether-text-tertiary">
            Pilens retning viser hvorfra vinden kommer.
          </p>
        </div>
      </div>

      {/* Wind Speed Backtest */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Wind className="h-5 w-5 text-aether-text-tertiary" />
              Vindhastighed backtest — sidste 7 dage
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
              <span className="legend-item"><span className="legend-dot bg-[#06b6d4]" /> ML</span>
              <span className="legend-item"><span className="legend-dot bg-[#22c55e]" /> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData.filter((d) => d.actualSpeed !== null || d.dmiSpeedHistory !== null || d.mlSpeedHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="windMlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="windDmiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                {forecastBoundaryTimestamp ? (
                  <ReferenceLine
                    x={forecastBoundaryTimestamp}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: "Nu", position: "top", fontSize: 11, fill: "#64748b", fontWeight: 600 }}
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
          <p className="mt-3 text-sm text-aether-text-secondary">
            Sammenligning af DMI's vindprognose, ML-modellen og faktisk målt vindhastighed de sidste 7 dage.
          </p>
        </CardContent>
      </Card>

      {/* Wind Speed Forecast */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Wind className="h-5 w-5 text-aether-text-tertiary" />
              Vindhastighed forecast — næste 48 timer
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
              <span className="legend-item"><span className="legend-dot bg-[#06b6d4]" /> ML</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-aether-text-secondary">
            Faktisk data kan først vises, når tiden er gået. Her ser du vores prognoser for fremtiden.
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData.filter((d) => d.dmiSpeedForecast !== null || d.mlSpeedForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="windForecastMlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="windForecastDmiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                {showDmi ? (
                  <Area type="monotone" dataKey="dmiSpeedForecast" name="DMI Forecast" stroke={COLORS.dmi} strokeWidth={2} fill="url(#windForecastDmiGradient)" dot={false} />
                ) : null}
                {showMlSpeed ? (
                  <Area type="monotone" dataKey="mlSpeedForecast" name="ML Forecast" stroke={COLORS.ml} strokeWidth={2} fill="url(#windForecastMlGradient)" dot={false} />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {showGusts ? (
        <>
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Wind className="h-5 w-5 text-aether-text-tertiary" />
                  Vindstød backtest — sidste 7 dage
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
                  <span className="legend-item"><span className="legend-dot bg-[#06b6d4]" /> ML</span>
                  <span className="legend-item"><span className="legend-dot bg-[#22c55e]" /> Faktisk</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData.filter((d) => d.actualGust !== null || d.dmiGustHistory !== null || d.mlGustHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gustMlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gustDmiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                    <XAxis {...sharedTimeAxisProps} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                    <Tooltip content={<CustomTooltip />} />
                    {forecastBoundaryTimestamp ? (
                      <ReferenceLine
                        x={forecastBoundaryTimestamp}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{ value: "Nu", position: "top", fontSize: 11, fill: "#64748b", fontWeight: 600 }}
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

          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <Wind className="h-5 w-5 text-aether-text-tertiary" />
                  Vindstød forecast — næste 48 timer
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
                  <span className="legend-item"><span className="legend-dot bg-[#06b6d4]" /> ML</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-aether-text-secondary">
                Faktisk data kan først vises, når tiden er gået. Her ser du vores prognoser for fremtiden.
              </p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData.filter((d) => d.dmiGustForecast !== null || d.mlGustForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gustForecastMlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gustForecastDmiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                    <XAxis {...sharedTimeAxisProps} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                    <Tooltip content={<CustomTooltip />} />
                    {showDmi ? (
                      <Area type="monotone" dataKey="dmiGustForecast" name="DMI Forecast" stroke={COLORS.dmi} strokeWidth={2} fill="url(#gustForecastDmiGradient)" dot={false} />
                    ) : null}
                    {showMlGust ? (
                      <Area type="monotone" dataKey="mlGustForecast" name="ML Forecast" stroke={COLORS.ml} strokeWidth={2} fill="url(#gustForecastMlGradient)" dot={false} />
                    ) : null}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Wind Direction Cards */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-base text-white">Vindretning de næste 12 timer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {forecast.slice(0, 12).map((hour) => (
            <div key={hour.timestamp} className="flex flex-col items-center">
              <WindCompass direction={hour.windDirection} size={64} />
              <span className="mt-1 text-xs text-aether-text-secondary">{formatDanishTime(hour.timestamp)}</span>
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] ${
                  hour.effectiveWindSpeedSource === "ml"
                    ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
                    : "border-coral/30 text-coral bg-coral/10"
                }`}
              >
                {getSourceLabel(hour.effectiveWindSpeedSource)}
              </Badge>
              <span className="mt-1 text-xs font-medium text-white">
                {hour.effectiveWindSpeed !== null ? `${hour.effectiveWindSpeed.toFixed(0)} m/s` : "—"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
