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
import { sharedTimeAxisProps } from "@/lib/chart";
import { formatDanishTime, formatShortDate, formatTooltipDateTime, getSourceLabel } from "@/lib/weather";
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
  timeKey: string;
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

const COLORS = {
  ml: "#06b6d4",
  dmi: "#f97316",
  actual: "#22c55e",
  grid: "rgba(255,255,255,0.04)",
};

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
      timeKey: point.timestamp,
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
      timeKey: point.timestamp,
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
  const forecastBoundaryTimestamp = forecast[0]?.timestamp ?? null;
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
      <div className="rounded-xl border border-white/[0.12] bg-[#0f172a]/95 backdrop-blur-xl p-3 shadow-2xl">
        <p className="mb-2 font-medium text-white text-sm">{formatTooltipDateTime(label)}</p>
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-aether-text-secondary">{entry.name}:</span>
            <span className="font-semibold text-white">
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      {rainAlert ? (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
          <strong>{rainAlert.title}:</strong> {rainAlert.message}
        </div>
      ) : null}

      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={rainEventStatus.hasActiveModel
              ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
              : "border-white/[0.08] text-aether-text-secondary bg-white/[0.03]"
            }
          >
            Regnrisiko: {rainEventStatus.statusLabel}
          </Badge>
          <Badge
            variant="outline"
            className={rainAmountStatus.hasActiveModel
              ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
              : "border-white/[0.08] text-aether-text-secondary bg-white/[0.03]"
            }
          >
            Regnmængde: {rainAmountStatus.statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-aether-text-secondary mt-2">{explanations.sources}</p>
      </div>

      {/* Current Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className={`glass-card p-6 ${currentRain.effectiveRainProb > 50 ? "border-sky-500/30" : ""}`}>
          <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">Regnrisiko lige nu</p>
          <div className="mt-2 flex items-center gap-2">
            {currentRain.effectiveRainProb > 50 ? <CloudRain className="h-6 w-6 text-sky-400" /> : <Sun className="h-6 w-6 text-amber-400" />}
            <span className="text-2xl font-bold text-white">{currentRain.effectiveRainProb > 50 ? "Regn i sigte" : "Tørt lige nu"}</span>
          </div>
          <Badge
            variant="outline"
            className={`mt-3 text-[10px] ${
              currentRain.effectiveRainProbSource === "ml"
                ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
                : "border-coral/30 text-coral bg-coral/10"
            }`}
          >
            {getSourceLabel(currentRain.effectiveRainProbSource)}
          </Badge>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-cyan-400">ML {currentRain.mlRainProb.toFixed(0)}%</span>
            <span className="text-aether-text-tertiary">•</span>
            <span className="text-coral">DMI {currentRain.dmiRainProb.toFixed(0)}%</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">Næste 24 timer</p>
          <div className="mt-2 flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-400" />
            <span className="text-2xl font-bold text-white">
              {forecast.slice(0, 24).reduce((sum, point) => sum + point.effectiveRainAmount, 0).toFixed(1)} mm
            </span>
          </div>
          <Badge
            variant="outline"
            className={`mt-3 text-[10px] ${
              currentRain.effectiveRainAmountSource === "ml"
                ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
                : "border-coral/30 text-coral bg-coral/10"
            }`}
          >
            {getSourceLabel(currentRain.effectiveRainAmountSource)}
          </Badge>
        </div>

        <div className="glass-card p-6">
          <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">Næste 48 timer</p>
          <div className="mt-2 flex items-center gap-2">
            <Umbrella className="h-5 w-5 text-aether-text-tertiary" />
            <span className="text-2xl font-bold text-white">
              {forecast.reduce((sum, point) => sum + point.effectiveRainAmount, 0).toFixed(1)} mm
            </span>
          </div>
          <p className="mt-3 text-sm text-aether-text-secondary">
            {forecast.filter((point) => point.effectiveRainProb >= 50).length} timer med høj regnrisiko
          </p>
        </div>
      </div>

      {/* Rain Probability Backtest */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <CloudRain className="h-5 w-5 text-aether-text-tertiary" />
              Regnrisiko backtest — sidste 7 dage
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
              <ComposedChart data={timelineData.filter((d) => d.actualProb !== null || d.dmiProbHistory !== null || d.mlProbHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke={COLORS.grid} />
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
                {hasHistory ? (
                  <Bar dataKey="actualProb" name="Faktisk regn" fill={COLORS.actual} radius={[3, 3, 0, 0]} />
                ) : null}
                <Line type="monotone" dataKey="dmiProbHistory" name="DMI Backtest" stroke={COLORS.dmi} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mlProbHistory" name="ML Backtest" stroke={COLORS.ml} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rain Probability Forecast */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <CloudRain className="h-5 w-5 text-aether-text-tertiary" />
              Regnrisiko forecast — næste 48 timer
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
              <ComposedChart data={timelineData.filter((d) => d.dmiProbForecast !== null || d.mlProbForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="dmiProbForecast" name="DMI Forecast" stroke={COLORS.dmi} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mlProbForecast" name="ML Forecast" stroke={COLORS.ml} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rain Amount Backtest */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Droplets className="h-5 w-5 text-aether-text-tertiary" />
              Regnmængde backtest — sidste 7 dage
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
              <span className="legend-item"><span className="legend-dot bg-[#06b6d4]" /> ML</span>
              <span className="legend-item"><span className="legend-dot bg-[#22c55e]" /> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-aether-text-secondary">{rainAmountStatus.statusDescription}</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter((d) => d.actualAmount !== null || d.dmiAmountHistory !== null || d.mlAmountHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                {hasHistory ? (
                  <Bar dataKey="actualAmount" name="Faktisk regnmængde" fill={COLORS.actual} radius={[3, 3, 0, 0]} />
                ) : null}
                <Line type="monotone" dataKey="dmiAmountHistory" name="DMI Backtest" stroke={COLORS.dmi} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mlAmountHistory" name="ML Backtest" stroke={COLORS.ml} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rain Amount Forecast */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Droplets className="h-5 w-5 text-aether-text-tertiary" />
              Regnmængde forecast — næste 48 timer
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
              <ComposedChart data={timelineData.filter((d) => d.dmiAmountForecast !== null || d.mlAmountForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="dmiAmountForecast" name="DMI Forecast" stroke={COLORS.dmi} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mlAmountForecast" name="ML Forecast" stroke={COLORS.ml} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Dry Periods */}
      {dryPeriods.length > 0 ? (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Sun className="h-4 w-4 text-amber-400" />
              Mulige tørre perioder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dryPeriods.map((period) => (
              <div
                key={`${period.start}-${period.end}`}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.1] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                    <Cloud className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatDanishTime(forecast[period.start]?.timestamp)} — {formatDanishTime(forecast[period.end]?.timestamp)}
                    </p>
                    <p className="text-xs text-aether-text-secondary">
                      {forecast[period.start] ? formatShortDate(forecast[period.start].timestamp) : "Ukendt"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-white/[0.08] text-aether-text-secondary">{period.hours} timer</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </motion.div>
  );
}
