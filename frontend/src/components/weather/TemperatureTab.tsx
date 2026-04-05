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
import { Button } from "@/components/ui/button";
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

// Chart colors matching the design
const COLORS = {
  ml: "#3b82f6",
  dmi: "#f97316",
  actual: "#10b981",
  apparent: "#f59e0b",
  grid: "#334155",
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
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-3 shadow-xl">
        <p className="mb-2 font-medium text-dashboard-text">{formatTooltipDateTime(label)}</p>
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-dashboard-text-muted">{entry.name}:</span>
            <span className="font-semibold text-dashboard-text">{entry.value?.toFixed?.(1) || entry.value}°C</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Status Card */}
      <Card className="dashboard-card-flat">
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge 
              variant={targetStatus.hasActiveModel ? "default" : "secondary"}
              className={targetStatus.hasActiveModel ? "bg-dashboard-ml" : "bg-dashboard-border"}
            >
              {targetStatus.statusLabel}
            </Badge>
            <Badge variant="outline" className="max-w-full whitespace-normal text-left leading-relaxed border-dashboard-border text-dashboard-text-muted">
              {explanations.forecast}
            </Badge>
          </div>
          <p className="text-sm text-dashboard-text-muted">{targetStatus.statusDescription}</p>
        </CardContent>
      </Card>

      {/* Stats and Help */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex max-w-full items-center gap-2 rounded-xl bg-gradient-to-r from-dashboard-ml to-dashboard-ml/70 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              <TrendingDown className="h-4 w-4 shrink-0" />
              <span className="whitespace-normal leading-relaxed">
                {improvement !== null
                  ? `ML har ${improvement.toFixed(1)}% lavere fejl end DMI`
                  : "Temperaturmodellen evalueres løbende"}
              </span>
            </div>
            <Badge variant="secondary" className="max-w-full whitespace-normal text-left leading-relaxed bg-dashboard-border text-dashboard-text">
              {avgDiff !== null ? `Typisk forskel: ${avgDiff.toFixed(2)}°C` : "Ingen aktiv ML-forskel endnu"}
            </Badge>
            <Badge variant="outline" className="max-w-full whitespace-normal text-left leading-relaxed border-dashboard-border text-dashboard-text-muted">
              {maxDiff !== null ? `Største forskel: ${maxDiff.toFixed(1)}°C` : "Ingen største forskel endnu"}
            </Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start sm:w-auto border-dashboard-border text-dashboard-text hover:bg-dashboard-card"
            onClick={() => setShowChartHelp((value) => !value)}
            aria-expanded={showChartHelp}
            aria-controls="temperature-chart-help"
          >
            <Info className="h-4 w-4 mr-2" />
            {showChartHelp ? "Skjul guide til grafer" : "Sådan læser du grafen"}
          </Button>
        </div>
        {showChartHelp ? (
          <Card id="temperature-chart-help" className="border-dashed border-dashboard-border bg-dashboard-card">
            <CardContent className="space-y-3 p-4 text-sm text-dashboard-text-muted">
              <div>
                <p className="font-medium text-dashboard-text">Backtest (historik)</p>
                <p>Blå streg = faktisk målt temperatur. Turkis og orange viser DMI og ML for samme tidspunkt.</p>
              </div>
              <div>
                <p className="font-medium text-dashboard-text">Forecast (fremtid)</p>
                <p>Turkis linje = DMI-prognose. Orange linje = ML-justeret prognose. Gul viser følt temperatur.</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Backtest Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-dashboard-text">
              <Thermometer className="h-5 w-5 text-dashboard-text-muted" />
              Temperatur backtest - sidste 7 dage
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI Data</span>
              <span className="legend-item"><span className="legend-dot bg-[#3b82f6]" /> ML Prognose</span>
              <span className="legend-item"><span className="legend-dot bg-[#10b981]" /> Faktisk Data</span>
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
                    <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="dmiBacktestGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                  tickFormatter={(value) => `${value}°`} 
                  domain={["dataMin - 2", "dataMax + 2"]}
                  stroke={COLORS.grid}
                />
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
          <p className="mt-3 text-sm text-dashboard-text-muted">
            Sammenligning af DMI&apos;s prognose, ML-modellen og den faktisk målte temperatur i de seneste 7 dage.
          </p>
        </CardContent>
      </Card>

      {/* Forecast Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-dashboard-text">
              <Thermometer className="h-5 w-5 text-dashboard-text-muted" />
              Temperaturprognose - næste 48 timer
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI Data</span>
              <span className="legend-item"><span className="legend-dot bg-[#3b82f6]" /> ML Prognose</span>
              <span className="legend-item"><span className="legend-dot bg-amber-500" /> Føles som</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-dashboard-text-muted">
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
                    <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="dmiForecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
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
        <h3 className="mb-4 text-lg font-semibold text-dashboard-text">Næste 16 timer</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {forecast.slice(0, 16).map((hour, index) => (
            <Card 
              key={hour.timestamp} 
              className={`dashboard-card-flat ${index === 0 ? "border-dashboard-ml" : ""}`}
            >
              <CardContent className="p-3 text-left sm:text-center">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-dashboard-text-muted">kl. {formatDanishTime(hour.timestamp)}</p>
                  <Badge
                    variant={hour.effectiveTempSource === "ml" ? "default" : "secondary"}
                    className={`max-w-full whitespace-normal text-[10px] leading-relaxed ${hour.effectiveTempSource === "ml" ? "bg-dashboard-ml" : "bg-dashboard-border"}`}
                  >
                    {getSourceLabel(hour.effectiveTempSource)}
                  </Badge>
                </div>
                <p className="my-1 text-xl font-bold text-dashboard-text">
                  {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)}°` : "—"}
                </p>
                <p className="text-xs text-dashboard-ml">
                  ML {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "ikke aktiv"}
                </p>
                <p className="text-xs text-dashboard-dmi">
                  DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "ingen data"}
                </p>
                {hour.apparentTemp !== null ? (
                  <p className="text-xs text-amber-500">
                    Føles {Math.round(hour.apparentTemp)}°
                  </p>
                ) : null}
                {index === 0 ? (
                  <Badge variant="outline" className="mt-2 border-dashboard-ml text-dashboard-ml">
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
