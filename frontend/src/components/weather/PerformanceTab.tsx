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
import { Button } from "@/components/ui/button";
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
  ml: "#3b82f6",
  dmi: "#f97316",
  actual: "#10b981",
  grid: "#334155",
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
    <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-3 shadow-xl">
      <p className="mb-2 font-medium text-dashboard-text">{formatTooltipDateTime(label)}</p>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-dashboard-text-muted">{entry.name}:</span>
          <span className="font-semibold text-dashboard-text">
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
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={yDomain} stroke={COLORS.grid} />
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
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={yDomain} stroke={COLORS.grid} />
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <section className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-dashboard-text">Model Performance and Accuracy Analysis</h1>
        <p className="text-dashboard-text-muted max-w-3xl mx-auto text-sm leading-relaxed">
          Sammenlign ML-modellernes præcision med DMI's prognoser og faktisk vejrdata. 
          Se hvordan modellen klarer sig på forskellige parametre og tidshorisonter.
        </p>
      </section>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dashboard-card-flat border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dashboard-text-muted">% ML was more accurate</p>
                <p className="mt-1 text-4xl font-bold text-emerald-500">
                  {verification.winRate !== null ? `${verification.winRate.toFixed(1)}%` : "—"}
                </p>
                <p className="text-xs text-dashboard-text-muted mt-1">
                  Den prognose, som alle sammenligninger starter fra
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <Award className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card-flat border-l-4 border-l-cyan-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dashboard-text-muted">Average deviation</p>
                <p className="mt-1 text-4xl font-bold text-cyan-500">
                  {verification.maeMl !== null ? verification.maeMl.toFixed(2) : "—"}
                </p>
                <p className="text-xs text-dashboard-text-muted mt-1">
                  Vores justerede bud på virkeligheden
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20">
                <Target className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card-flat border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dashboard-text-muted">General precision score</p>
                <p className="mt-1 text-4xl font-bold text-blue-500">
                  {verification.rmseMl !== null ? verification.rmseMl.toFixed(2) : "—"}
                </p>
                <p className="text-xs text-dashboard-text-muted mt-1">
                  Jo lavere værdi, jo bedre præcision
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["temperature", "wind", "rain"] as PerformanceSection[]).map((item) => (
          <Button
            key={item}
            variant={section === item ? "default" : "outline"}
            onClick={() => setSection(item)}
            className={section === item ? "bg-dashboard-ml" : "border-dashboard-border text-dashboard-text"}
          >
            {sectionLabels[item]}
          </Button>
        ))}
      </div>

      {/* Historical Comparison Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dashboard-text">
            <TrendingUp className="h-5 w-5 text-dashboard-text-muted" />
            Historisk sammenligning: {sectionLabels[section]}
          </CardTitle>
          <CardDescription className="text-dashboard-text-muted">
            Sammenlign DMI, ML og faktisk vejr i den seneste verificerede historik.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-4 text-sm pt-2">
            <span className="legend-item"><span className="legend-dot bg-[#3b82f6]" /> ML</span>
            <span className="legend-item"><span className="legend-dot bg-[#f97316]" /> DMI</span>
            <span className="legend-item"><span className="legend-dot bg-[#10b981]" /> Faktisk</span>
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

      {/* Error Analysis Chart */}
      <Card className="dashboard-card-flat">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dashboard-text">
            <AlertTriangle className="h-5 w-5 text-dashboard-text-muted" />
            Fejlanalyse: {sectionLabels[section]}
          </CardTitle>
          <CardDescription className="text-dashboard-text-muted">
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

      {/* Model Info Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="dashboard-card-flat">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-dashboard-text">
              <Cpu className="h-4 w-4 text-dashboard-text-muted" />
              Hvad modellen lægger vægt på
            </CardTitle>
            <CardDescription className="text-dashboard-text-muted">
              Det, som modellen lægger mest vægt på i sine beregninger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleFeatures.length > 0 ? (
              visibleFeatures.map((feature) => (
                <div key={`${feature.target}-${feature.feature}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dashboard-text">
                      {humanizeFeatureName(feature.feature)}{" "}
                      <span className="text-dashboard-text-muted">({getFeatureTargetBadge(feature, targetLabels)})</span>
                    </span>
                    <span className="font-medium text-dashboard-text">{(feature.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-dashboard-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-dashboard-ml to-dashboard-ml/70"
                      style={{ width: `${Math.max(feature.importance * 100, 2)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-dashboard-text-muted">
                Feature importance er ikke tilgængelig for dette signal endnu.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-card-flat">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-dashboard-text">
              <CheckCircle className="h-4 w-4 text-dashboard-text-muted" />
              Modelinfo og status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-dashboard-border bg-dashboard-card p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-dashboard-text-muted" />
                <span className="text-sm text-dashboard-text-muted">Sidste træning</span>
              </div>
              <span className="text-sm font-medium text-dashboard-text">
                {modelInfo.trainedAt ? formatDanishDateTime(modelInfo.trainedAt) : "Ukendt"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-dashboard-border bg-dashboard-card p-3">
              <span className="text-sm text-dashboard-text-muted">Træningssamples</span>
              <span className="text-sm font-medium text-dashboard-text">
                {modelInfo.trainingSamples !== null ? modelInfo.trainingSamples.toLocaleString("da-DK") : "Ukendt"}
              </span>
            </div>
            <div className="space-y-3 rounded-xl border border-dashboard-border bg-dashboard-card p-3">
              {selectedStatus.map(({ target, status }) => (
                <div key={target}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-dashboard-text">{getTargetLabel(targetLabels, target)}</span>
                    <Badge 
                      variant={status.hasActiveModel ? "default" : "secondary"}
                      className={status.hasActiveModel ? "bg-dashboard-ml" : "bg-dashboard-border"}
                    >
                      {status.statusLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-dashboard-text-muted">{status.statusDescription}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
