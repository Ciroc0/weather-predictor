import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Cpu,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { sharedTimeAxisProps } from "@/lib/chart";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDanishDateTime,
  formatTooltipDateTime,
  getFeatureTargetBadge,
  getTargetLabel,
  humanizeFeatureName,
} from "@/lib/weather";
import type {
  DashboardExplanations,
  DashboardHistory,
  FeatureImportance,
  ForecastTarget,
  LeadBucketPerformance,
  ModelInfo,
  TargetLabels,
  TargetStatus,
  VerificationMetrics,
} from "@/types/weather";

interface PerformanceTabProps {
  verification: VerificationMetrics;
  leadBuckets: LeadBucketPerformance[];
  featureImportance: FeatureImportance[];
  modelInfo: ModelInfo;
  history: DashboardHistory;
  targetStatus: Record<ForecastTarget, TargetStatus>;
  targetLabels: TargetLabels;
  explanations: DashboardExplanations;
}

type PerformanceSection = "temperature" | "wind" | "rain";

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

interface TimeSeriesPoint {
  timeKey: string;
  dmi: number | null;
  ml: number | null;
  actual: number | null;
}

interface ErrorPoint {
  timeKey: string;
  dmiError: number | null;
  mlError: number | null;
}

const sectionTargets: Record<PerformanceSection, ForecastTarget[]> = {
  temperature: ["temperature"],
  wind: ["wind_speed", "wind_gust"],
  rain: ["rain_event", "rain_amount"],
};

const sectionLabels: Record<PerformanceSection, string> = {
  temperature: "Temperatur",
  wind: "Vind",
  rain: "Regn",
};

// Chart colors
const COLORS = {
  ml: "#06b6d4",
  dmi: "#f97316",
  actual: "#22c55e",
  grid: "rgba(255,255,255,0.04)",
};

function SeriesTooltip({
  active,
  payload,
  label,
  suffix = "",
  decimals = 1,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  suffix?: string;
  decimals?: number;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/[0.12] bg-[#0f172a]/95 backdrop-blur-xl p-3 shadow-2xl">
      <p className="mb-2 font-medium text-white text-sm">{formatTooltipDateTime(label)}</p>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-aether-text-secondary">{entry.name}:</span>
          <span className="font-semibold text-white">
            {entry.value?.toFixed?.(decimals) || entry.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function TimeSeriesChart({
  data,
  suffix = "",
  yDomain,
  actualName = "Faktisk vejr",
  dmiName = "DMI-prognose",
  mlName = "ML-prognose",
}: {
  data: TimeSeriesPoint[];
  suffix?: string;
  yDomain?: [number, number] | undefined;
  actualName?: string;
  dmiName?: string;
  mlName?: string;
}) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis {...sharedTimeAxisProps} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={yDomain} stroke={COLORS.grid} />
          <Tooltip content={<SeriesTooltip suffix={suffix} />} />
          <Line type="monotone" dataKey="dmi" name={dmiName} stroke={COLORS.dmi} strokeWidth={2} dot={false} strokeOpacity={0.9} />
          <Line type="monotone" dataKey="ml" name={mlName} stroke={COLORS.ml} strokeWidth={2} dot={false} strokeOpacity={0.9} />
          <Line type="monotone" dataKey="actual" name={actualName} stroke={COLORS.actual} strokeWidth={2} dot={false} strokeOpacity={0.9} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ErrorChart({
  data,
  title,
  suffix = "",
  yDomain,
}: {
  data: ErrorPoint[];
  title: string;
  suffix?: string;
  yDomain?: [number, number] | undefined;
}) {
  return (
    <div className="h-[280px] w-full">
      <p className="mb-2 text-sm font-medium text-dashboard-text">{title}</p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="dmiErrorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.dmi} stopOpacity={0.4} />
              <stop offset="95%" stopColor={COLORS.dmi} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="mlErrorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.ml} stopOpacity={0.4} />
              <stop offset="95%" stopColor={COLORS.ml} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis {...sharedTimeAxisProps} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={yDomain} stroke={COLORS.grid} />
          <Tooltip content={<SeriesTooltip suffix={suffix} decimals={2} />} />
          <Area type="monotone" dataKey="dmiError" name="DMI fejl" stroke={COLORS.dmi} fill="url(#dmiErrorGradient)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="mlError" name="ML fejl" stroke={COLORS.ml} fill="url(#mlErrorGradient)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function buildTemperatureSeries(history: DashboardHistory): TimeSeriesPoint[] {
  return history.temperature.map((point) => ({
    timeKey: point.timestamp,
    dmi: point.dmiTemp,
    ml: point.mlTemp,
    actual: point.actual,
  }));
}

function buildWindSpeedSeries(history: DashboardHistory): TimeSeriesPoint[] {
  return history.wind.map((point) => ({
    timeKey: point.timestamp,
    dmi: point.dmiWindSpeed,
    ml: point.mlWindSpeed,
    actual: point.actualWindSpeed,
  }));
}

function buildWindGustSeries(history: DashboardHistory): TimeSeriesPoint[] {
  return history.wind.map((point) => ({
    timeKey: point.timestamp,
    dmi: point.dmiWindGust,
    ml: point.mlWindGust,
    actual: point.actualWindGust,
  }));
}

function buildRainProbabilitySeries(history: DashboardHistory): TimeSeriesPoint[] {
  return history.rain.map((point) => ({
    timeKey: point.timestamp,
    dmi: point.dmiRainProb,
    ml: point.mlRainProb,
    actual: point.actualRainEvent !== null ? point.actualRainEvent * 100 : null,
  }));
}

function buildRainAmountSeries(history: DashboardHistory): TimeSeriesPoint[] {
  return history.rain.map((point) => ({
    timeKey: point.timestamp,
    dmi: point.dmiRainAmount,
    ml: point.mlRainAmount,
    actual: point.actualRainAmount,
  }));
}

function toErrorData(
  rows: Array<{ timeKey: string; actual: number | null; dmi: number | null; ml: number | null }>,
): ErrorPoint[] {
  return rows
    .filter((row) => row.actual !== null)
    .map((row) => ({
      timeKey: row.timeKey,
      dmiError: row.dmi !== null && row.actual !== null ? Math.abs(row.dmi - row.actual) : null,
      mlError: row.ml !== null && row.actual !== null ? Math.abs(row.ml - row.actual) : null,
    }));
}

export function PerformanceTab({
  verification,
  featureImportance,
  modelInfo,
  history,
  targetStatus,
  targetLabels,
}: PerformanceTabProps) {
  const [section, setSection] = useState<PerformanceSection>("temperature");

  const selectedTargets = sectionTargets[section];

  const visibleFeatures = useMemo(() => {
    return featureImportance
      .filter((feature) => selectedTargets.includes(feature.target as ForecastTarget))
      .slice(0, 8);
  }, [featureImportance, selectedTargets]);

  const selectedStatus = selectedTargets.map((target) => ({
    target,
    status: targetStatus[target],
  }));

  const temperatureSeries = useMemo(() => buildTemperatureSeries(history), [history]);
  const windSpeedSeries = useMemo(() => buildWindSpeedSeries(history), [history]);
  const windGustSeries = useMemo(() => buildWindGustSeries(history), [history]);
  const rainProbabilitySeries = useMemo(() => buildRainProbabilitySeries(history), [history]);
  const rainAmountSeries = useMemo(() => buildRainAmountSeries(history), [history]);

  const temperatureErrors = useMemo(() => toErrorData(temperatureSeries), [temperatureSeries]);
  const windSpeedErrors = useMemo(() => toErrorData(windSpeedSeries), [windSpeedSeries]);
  const windGustErrors = useMemo(() => toErrorData(windGustSeries), [windGustSeries]);
  const rainProbabilityErrors = useMemo(() => toErrorData(rainProbabilitySeries), [rainProbabilitySeries]);
  const rainAmountErrors = useMemo(() => toErrorData(rainAmountSeries), [rainAmountSeries]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-6 border-l-2 border-l-emerald-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">ML win rate</p>
              <p className="text-4xl font-bold text-emerald-400">
                {verification.winRate !== null ? `${verification.winRate.toFixed(1)}%` : "—"}
              </p>
              <p className="text-xs text-aether-text-secondary mt-1">Hvor ofte ML ramte rigtigst</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10">
              <Award className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-2 border-l-cyan-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">Gennemsnitlig afvigelse</p>
              <p className="text-4xl font-bold text-cyan-400">
                {verification.maeMl !== null ? verification.maeMl.toFixed(2) : "—"}
              </p>
              <p className="text-xs text-aether-text-secondary mt-1">Typisk afvigelse fra virkeligheden</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10">
              <Target className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-2 border-l-violet-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">RMSE score</p>
              <p className="text-4xl font-bold text-violet-400">
                {verification.rmseMl !== null ? verification.rmseMl.toFixed(2) : "—"}
              </p>
              <p className="text-xs text-aether-text-secondary mt-1">Jo lavere værdi, jo bedre</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10">
              <BarChart3 className="h-6 w-6 text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["temperature", "wind", "rain"] as PerformanceSection[]).map((item) => (
          <button
            key={item}
            onClick={() => setSection(item)}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${section === item ? "bg-white/[0.12] text-white shadow-lg" : "bg-white/[0.03] text-aether-text-secondary hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"}`}
          >
            {sectionLabels[item]}
          </button>
        ))}
      </div>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <TrendingUp className="h-5 w-5 text-aether-text-tertiary" />
            Historisk sammenligning: {sectionLabels[section]}
          </CardTitle>
          <CardDescription className="text-aether-text-secondary text-sm">
            Sammenlign DMI, ML og faktisk vejr i den seneste verificerede historik.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
            <span className="legend-item"><span className="legend-dot bg-[#06b6d4]" /> ML</span>
            <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
            <span className="legend-item"><span className="legend-dot bg-[#22c55e]" /> Faktisk</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {section === "temperature" ? (
            temperatureSeries.length > 0 ? (
              <TimeSeriesChart data={temperatureSeries} suffix="°C" />
            ) : (
              <p className="text-sm text-dashboard-text-muted">Ingen verificeret temperaturhistorik endnu.</p>
            )
          ) : null}

          {section === "wind" ? (
            windSpeedSeries.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <TimeSeriesChart data={windSpeedSeries} suffix=" m/s" actualName="Faktisk vind" dmiName="DMI vind" mlName="ML vind" />
                <TimeSeriesChart data={windGustSeries} suffix=" m/s" actualName="Faktisk vindstød" dmiName="DMI vindstød" mlName="ML vindstød" />
              </div>
            ) : (
              <p className="text-sm text-dashboard-text-muted">Ingen verificeret vindhistorik endnu.</p>
            )
          ) : null}

          {section === "rain" ? (
            rainProbabilitySeries.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <TimeSeriesChart data={rainProbabilitySeries} suffix="%" yDomain={[0, 100]} actualName="Faktisk regn" dmiName="DMI regnrisiko" mlName="ML regnrisiko" />
                <TimeSeriesChart data={rainAmountSeries} suffix=" mm" actualName="Faktisk regnmængde" dmiName="DMI regnmængde" mlName="ML regnmængde" />
              </div>
            ) : (
              <p className="text-sm text-dashboard-text-muted">Ingen verificeret regnhistorik endnu.</p>
            )
          ) : null}
        </CardContent>
      </Card>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <AlertTriangle className="h-5 w-5 text-aether-text-tertiary" />
            Fejlanalyse: {sectionLabels[section]}
          </CardTitle>
          <CardDescription className="text-aether-text-secondary text-sm">
            Viser absolutte fejl for DMI og ML-prognoser sammenlignet med faktisk vejr. Lavere er bedre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {section === "temperature" ? (
            temperatureErrors.length > 0 ? (
              <ErrorChart data={temperatureErrors} title="Temperaturfejl (°C)" suffix="°C" />
            ) : (
              <p className="text-sm text-dashboard-text-muted">Ingen fejldata tilgængelig endnu.</p>
            )
          ) : null}

          {section === "wind" ? (
            windSpeedErrors.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <ErrorChart data={windSpeedErrors} title="Vindfejl (m/s)" suffix=" m/s" />
                <ErrorChart data={windGustErrors} title="Vindstødsfejl (m/s)" suffix=" m/s" />
              </div>
            ) : (
              <p className="text-sm text-dashboard-text-muted">Ingen fejldata tilgængelig endnu.</p>
            )
          ) : null}

          {section === "rain" ? (
            rainProbabilityErrors.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <ErrorChart data={rainProbabilityErrors} title="Regnrisikofejl (%-point)" suffix="%" yDomain={[0, 100]} />
                <ErrorChart data={rainAmountErrors} title="Regnmængdefejl (mm)" suffix=" mm" />
              </div>
            ) : (
              <p className="text-sm text-dashboard-text-muted">Ingen fejldata tilgængelig endnu.</p>
            )
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Cpu className="h-4 w-4 text-aether-text-tertiary" />
              Hvad modellen lægger vægt på
            </CardTitle>
            <CardDescription className="text-aether-text-secondary text-sm">
              Features der har størst indflydelse på modellens forudsigelser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visibleFeatures.length > 0 ? (
              visibleFeatures.map((feature) => (
                <div key={`${feature.target}-${feature.feature}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">
                      {humanizeFeatureName(feature.feature)}{" "}
                      <span className="text-aether-text-tertiary">({getFeatureTargetBadge(feature, targetLabels)})</span>
                    </span>
                    <span className="font-medium text-cyan-400">{(feature.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(feature.importance * 100, 2)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-aether-text-secondary">
                Feature importance er ikke tilgængelig for dette signal endnu.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <CheckCircle className="h-4 w-4 text-aether-text-tertiary" />
              Modelinfo og status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-aether-text-tertiary" />
                <span className="text-sm text-aether-text-secondary">Sidste træning</span>
              </div>
              <span className="text-sm font-medium text-white">
                {modelInfo.trainedAt ? formatDanishDateTime(modelInfo.trainedAt) : "Ukendt"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <span className="text-sm text-aether-text-secondary">Træningssamples</span>
              <span className="text-sm font-medium text-white">
                {modelInfo.trainingSamples !== null ? modelInfo.trainingSamples.toLocaleString("da-DK") : "Ukendt"}
              </span>
            </div>
            <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              {selectedStatus.map(({ target, status }) => (
                <div key={target}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{getTargetLabel(targetLabels, target)}</span>
                    <Badge
                      variant="outline"
                      className={status.hasActiveModel ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10 text-[10px]" : "border-white/[0.08] text-aether-text-secondary bg-white/[0.03] text-[10px]"}
                    >
                      {status.statusLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-aether-text-secondary">{status.statusDescription}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
