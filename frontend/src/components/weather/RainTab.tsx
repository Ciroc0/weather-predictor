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

// Chart colors
const COLORS = {
  ml: "#3b82f6",
  dmi: "#f97316",
  actual: "#10b981",
  grid: "#334155",
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
      <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-3 shadow-xl">
        <p className="mb-2 font-medium text-dashboard-text">{formatTooltipDateTime(label)}</p>
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-dashboard-text-muted">{entry.name}:</span>
            <span className="font-semibold text-dashboard-text">
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
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
          <strong>{rainAlert.title}:</strong> {rainAlert.message}
        </div>
      ) : null}

      <Card className="dashboard-card-flat">
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge 
              variant={rainEventStatus.hasActiveModel ? "default" : "secondary"}
              className={rainEventStatus.hasActiveModel ? "bg-dashboard-ml" : "bg-dashboard-border"}
            >
              Regnrisiko: {rainEventStatus.statusLabel}
            </Badge>
            <Badge 
              variant={rainAmountStatus.hasActiveModel ? "default" : "secondary"}
              className={rainAmountStatus.hasActiveModel ? "bg-dashboard-ml" : "bg-dashboard-border"}
            >
              Regnmængde: {rainAmountStatus.statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-dashboard-text-muted">{explanations.sources}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={`dashboard-card-flat ${currentRain.effectiveRainProb > 50 ? "border-blue-500/30" : ""}`}>
          <CardContent className="p-6">
            <p className="text-sm text-dashboard-text-muted">Regnrisiko lige nu</p>
            <div className="mt-2 flex items-center gap-2">
              {currentRain.effectiveRainProb > 50 ? <CloudRain className="h-6 w-6 text-blue-400" /> : <Sun className="h-6 w-6 text-amber-400" />}
              <span className="text-2xl font-bold text-dashboard-text">{currentRain.effectiveRainProb > 50 ? "Regn i sigte" : "Tørt lige nu"}</span>
            </div>
            <Badge 
              variant={currentRain.effectiveRainProbSource === "ml" ? "default" : "secondary"}
              className={`mt-3 ${currentRain.effectiveRainProbSource === "ml" ? "bg-dashboard-ml" : "bg-dashboard-border"}`}
            >
              {getSourceLabel(currentRain.effectiveRainProbSource)}
            </Badge>
            <p className="mt-2 text-sm text-dashboard-text-muted">
              <span className="text-dashboard-ml">ML: {currentRain.mlRainProb.toFixed(0)}%</span>
              <span className="mx-2">•</span>
              <span className="text-dashboard-dmi">DMI: {currentRain.dmiRainProb.toFixed(0)}%</span>
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-card-flat">
          <CardContent className="p-6">
            <p className="text-sm text-dashboard-text-muted">Næste 24 timer</p>
            <div className="mt-2 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-dashboard-ml" />
              <span className="text-xl font-bold text-dashboard-text">
                {forecast.slice(0, 24).reduce((sum, point) => sum + point.effectiveRainAmount, 0).toFixed(1)} mm
              </span>
            </div>
            <Badge 
              variant={currentRain.effectiveRainAmountSource === "ml" ? "default" : "secondary"}
              className={`mt-3 ${currentRain.effectiveRainAmountSource === "ml" ? "bg-dashboard-ml" : "bg-dashboard-border"}`}
            >
              {getSourceLabel(currentRain.effectiveRainAmountSource)}
            </Badge>
          </CardContent>
        </Card>
        <Card className="dashboard-card-flat">
          <CardContent className="p-6">
            <p className="text-sm text-dashboard-text-muted">Næste 48 timer</p>
            <div className="mt-2 flex items-center gap-2">
              <Umbrella className="h-5 w-5 text-dashboard-text-muted" />
              <span className="text-xl font-bold text-dashboard-text">
                {forecast.reduce((sum, point) => sum + point.effectiveRainAmount, 0).toFixed(1)} mm
              </span>
            </div>
            <p className="mt-2 text-sm text-dashboard-text-muted">
              {forecast.filter((point) => point.effectiveRainProb >= 50).length} timer med høj regnrisiko
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rain Probability Backtest Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-dashboard-text">
              <CloudRain className="h-5 w-5 text-dashboard-text-muted" />
              Regnrisiko backtest - sidste 7 dage
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
              <ComposedChart data={timelineData.filter((d) => d.actualProb !== null || d.dmiProbHistory !== null || d.mlProbHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                {forecastBoundaryTimestamp ? (
                  <ReferenceLine
                    x={forecastBoundaryTimestamp}
                    stroke="#475569"
                    strokeWidth={2}
                    label={{ value: "Nu", position: "top", fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
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

      {/* Rain Probability Forecast Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-dashboard-text">
              <CloudRain className="h-5 w-5 text-dashboard-text-muted" />
              Regnrisiko forecast - næste 48 timer
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
              <ComposedChart data={timelineData.filter((d) => d.dmiProbForecast !== null || d.mlProbForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="dmiProbForecast"
                  name="DMI Forecast"
                  stroke={COLORS.dmi}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mlProbForecast"
                  name="ML Forecast"
                  stroke={COLORS.ml}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-dashboard-text-muted">
            Sammenligning af DMI&apos;s regnrisiko, ML-modellen og faktisk registreret regn de sidste 7 dage.
          </p>
        </CardContent>
      </Card>

      {/* Rain Amount Backtest Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-dashboard-text">
              <Droplets className="h-5 w-5 text-dashboard-text-muted" />
              Regnmængde backtest - sidste 7 dage
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
              <span className="legend-item"><span className="legend-dot bg-[#3b82f6]" /> ML</span>
              <span className="legend-item"><span className="legend-dot bg-[#10b981]" /> Faktisk</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-dashboard-text-muted">{rainAmountStatus.statusDescription}</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineData.filter((d) => d.actualAmount !== null || d.dmiAmountHistory !== null || d.mlAmountHistory !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

      {/* Rain Amount Forecast Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-dashboard-text">
              <Droplets className="h-5 w-5 text-dashboard-text-muted" />
              Regnmængde forecast - næste 48 timer
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
              <ComposedChart data={timelineData.filter((d) => d.dmiAmountForecast !== null || d.mlAmountForecast !== null)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => Number(value).toFixed(1)} stroke={COLORS.grid} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="dmiAmountForecast"
                  name="DMI Forecast"
                  stroke={COLORS.dmi}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mlAmountForecast"
                  name="ML Forecast"
                  stroke={COLORS.ml}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {dryPeriods.length > 0 ? (
        <Card className="dashboard-card-flat">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-dashboard-text">
              <Sun className="h-4 w-4 text-amber-400" />
              Mulige tørre perioder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dryPeriods.map((period) => (
              <div
                key={`${period.start}-${period.end}`}
                className="flex items-center justify-between rounded-xl border border-dashboard-border bg-dashboard-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                    <Cloud className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-dashboard-text">
                      kl. {formatDanishTime(forecast[period.start]?.timestamp)} - kl. {formatDanishTime(forecast[period.end]?.timestamp)}
                    </p>
                    <p className="text-sm text-dashboard-text-muted">
                      {forecast[period.start] ? formatShortDate(forecast[period.start].timestamp) : "Ukendt"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-dashboard-border">{period.hours} timer</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </motion.div>
  );
}
