import { useState } from "react";
import { motion } from "framer-motion";
import { Info, Thermometer, TrendingDown } from "lucide-react";
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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sharedTimeAxisProps } from "@/lib/chart";
import { formatDanishTime, formatTooltipDateTime, getSourceLabel } from "@/lib/weather";
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

const COLORS = {
  ml: "#06b6d4",
  dmi: "#f97316",
  actual: "#22c55e",
  apparent: "#fbbf24",
  grid: "rgba(255,255,255,0.04)",
};

export function TemperatureTab({
  forecast,
  history,
  verification,
  targetStatus,
  explanations,
}: TemperatureTabProps) {
  const [showChartHelp, setShowChartHelp] = useState(false);
  const hasMlSeries = targetStatus.hasActiveModel && forecast.some((point) => point.mlTemp !== null);
  const hasHistory = history.length > 0;
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
      <div className="rounded-xl border border-white/[0.12] bg-[#0f172a]/95 backdrop-blur-xl p-3 shadow-2xl">
        <p className="mb-2 font-medium text-white text-sm">{formatTooltipDateTime(label)}</p>
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-xs">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-aether-text-secondary">{entry.name}:</span>
            <span className="font-semibold text-white">{entry.value?.toFixed?.(1) || entry.value}°C</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Status Card */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={targetStatus.hasActiveModel
              ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
              : "border-white/[0.08] text-aether-text-secondary bg-white/[0.03]"
            }
          >
            {targetStatus.statusLabel}
          </Badge>
          <Badge variant="outline" className="text-xs border-white/[0.08] text-aether-text-secondary bg-white/[0.03] max-w-full whitespace-normal text-left leading-relaxed">
            {explanations.forecast}
          </Badge>
        </div>
        <p className="text-sm text-aether-text-secondary mt-2">{targetStatus.statusDescription}</p>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex max-w-full items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-400 border border-cyan-500/20">
            <TrendingDown className="h-4 w-4 shrink-0" />
            <span className="whitespace-normal leading-relaxed">
              {improvement !== null
                ? `ML har ${improvement.toFixed(1)}% lavere fejl end DMI`
                : "Temperaturmodellen evalueres løbende"}
            </span>
          </div>
          {avgDiff !== null && (
            <Badge variant="outline" className="text-xs border-white/[0.08] text-aether-text-secondary bg-white/[0.03]">
              Typisk forskel: {avgDiff.toFixed(2)}°C
            </Badge>
          )}
          {maxDiff !== null && (
            <Badge variant="outline" className="text-xs border-white/[0.08] text-aether-text-secondary bg-white/[0.03]">
              Største forskel: {maxDiff.toFixed(1)}°C
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowChartHelp((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-aether-text-secondary hover:text-white hover:bg-white/[0.06] transition-all w-full sm:w-auto justify-center"
        >
          <Info className="h-4 w-4" />
          {showChartHelp ? "Skjul guide" : "Sådan læser du grafen"}
        </button>
      </div>

      {showChartHelp ? (
        <div className="glass-card p-5 border-dashed">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-white mb-1">Backtest (historik)</p>
              <p className="text-aether-text-secondary">Grøn streg = faktisk målt temperatur. Cyan og orange viser DMI og ML for samme tidspunkt.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Forecast (fremtid)</p>
              <p className="text-aether-text-secondary">Cyan linje = ML-prognose. Orange linje = DMI-prognose. Gul viser følt temperatur.</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Backtest Chart */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Thermometer className="h-5 w-5 text-aether-text-tertiary" />
              Temperatur backtest — sidste 7 dage
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
              <span className="legend-item"><span className="legend-dot bg-[#06b6d4]" /> ML</span>
              <span className="legend-item"><span className="legend-dot bg-[#22c55e]" /> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData.filter((d) => d.actual !== null || d.dmiHistory !== null || d.mlHistory !== null)}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="mlBacktestGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dmiBacktestGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(value) => `${value}°`}
                  domain={["dataMin - 2", "dataMax + 2"]}
                  stroke={COLORS.grid}
                />
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
                  <Area
                    type="monotone"
                    dataKey="dmiHistory"
                    name="DMI-backtest"
                    stroke={COLORS.dmi}
                    strokeWidth={2}
                    fill="url(#dmiBacktestGradient)"
                    dot={{ r: 2, fill: COLORS.dmi }}
                  />
                ) : null}
                {showMl && hasMlSeries ? (
                  <Area
                    type="monotone"
                    dataKey="mlHistory"
                    name="ML-backtest"
                    stroke={COLORS.ml}
                    strokeWidth={2}
                    fill="url(#mlBacktestGradient)"
                    dot={{ r: 2, fill: COLORS.ml }}
                  />
                ) : null}
                {hasHistory ? (
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Faktisk temperatur"
                    stroke={COLORS.actual}
                    strokeWidth={2}
                    fill="transparent"
                    dot={{ r: 2, fill: COLORS.actual }}
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-aether-text-secondary">
            Sammenligning af DMI's prognose, ML-modellen og den faktisk målte temperatur i de seneste 7 dage.
          </p>
        </CardContent>
      </Card>

      {/* Forecast Chart */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Thermometer className="h-5 w-5 text-aether-text-tertiary" />
              Temperaturprognose — næste 48 timer
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
              <span className="legend-item"><span className="legend-dot bg-[#06b6d4]" /> ML</span>
              <span className="legend-item"><span className="legend-dot bg-[#fbbf24]" /> Føles som</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-aether-text-secondary">
            Faktiske data kan først vises, når tiden er gået. Her ser du vores prognoser for fremtiden.
          </p>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData.filter((d) => d.dmiForecast !== null || d.mlForecast !== null)}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="mlForecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dmiForecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(value) => `${value}°`}
                  domain={["dataMin - 2", "dataMax + 2"]}
                  stroke={COLORS.grid}
                />
                <Tooltip content={<CustomTooltip />} />
                {showDmi ? (
                  <Area
                    type="monotone"
                    dataKey="dmiForecast"
                    name="DMI-prognose"
                    stroke={COLORS.dmi}
                    strokeWidth={2}
                    fill="url(#dmiForecastGradient)"
                    dot={{ r: 2, fill: COLORS.dmi }}
                  />
                ) : null}
                {showMl && hasMlSeries ? (
                  <Area
                    type="monotone"
                    dataKey="mlForecast"
                    name="ML-prognose"
                    stroke={COLORS.ml}
                    strokeWidth={2}
                    fill="url(#mlForecastGradient)"
                    dot={{ r: 2, fill: COLORS.ml }}
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey="apparentForecast"
                  name="Føles som"
                  stroke={COLORS.apparent}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Cards */}
      <div>
        <h3 className="section-title mb-4">Næste 16 timer</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {forecast.slice(0, 16).map((hour, index) => (
            <div
              key={hour.timestamp}
              className={`glass-card-hover p-4 ${index === 0 ? "border-cyan-500/30" : ""}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs text-aether-text-tertiary">{formatDanishTime(hour.timestamp)}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 px-1.5 ${
                    hour.effectiveTempSource === "ml"
                      ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
                      : "border-coral/30 text-coral bg-coral/10"
                  }`}
                >
                  {getSourceLabel(hour.effectiveTempSource)}
                </Badge>
              </div>
              <p className="my-1 text-2xl font-bold text-white">
                {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)}°` : "—"}
              </p>
              <div className="space-y-1 text-xs">
                <p className="text-cyan-400">
                  ML {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "ikke aktiv"}
                </p>
                <p className="text-coral">
                  DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "ingen data"}
                </p>
              </div>
              {hour.apparentTemp !== null ? (
                <p className="text-xs text-amber-400 mt-2">
                  Føles {Math.round(hour.apparentTemp)}°
                </p>
              ) : null}
              {index === 0 ? (
                <Badge variant="outline" className="mt-2 text-[10px] border-cyan-500/30 text-cyan-400">
                  Nu
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
