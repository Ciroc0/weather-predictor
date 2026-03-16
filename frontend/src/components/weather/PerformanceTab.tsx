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
  Bar,
  BarChart,
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
import { Progress } from "@/components/ui/progress";
import {
  formatDanishDateTime,
  formatMetric,
  formatTooltipDateTime,
  getFeatureTargetBadge,
  getReadableMetricName,
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
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-2 font-medium">{formatTooltipDateTime(label)}</p>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
          <span className="font-semibold">
            {entry.value.toFixed(decimals)}
            {suffix}
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
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
          <XAxis {...sharedTimeAxisProps} />
          <YAxis tick={{ fontSize: 12 }} domain={yDomain} />
          <Tooltip content={<SeriesTooltip suffix={suffix} />} />
          <Line type="monotone" dataKey="dmi" name={dmiName} stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.9} />
          <Line type="monotone" dataKey="ml" name={mlName} stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.9} />
          <Line type="monotone" dataKey="actual" name={actualName} stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.9} />
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
      <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
          <XAxis {...sharedTimeAxisProps} />
          <YAxis tick={{ fontSize: 12 }} domain={yDomain} />
          <Tooltip content={<SeriesTooltip suffix={suffix} decimals={2} />} />
          <Area type="monotone" dataKey="dmiError" name="DMI fejl" stroke="#27D6F5" fill="#27D6F5" fillOpacity={0.28} strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="mlError" name="ML fejl" stroke="#F54927" fill="#F54927" fillOpacity={0.28} strokeWidth={2} dot={false} />
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
  leadBuckets,
  featureImportance,
  modelInfo,
  history,
  targetStatus,
  targetLabels,
  explanations,
}: PerformanceTabProps) {
  const [section, setSection] = useState<PerformanceSection>("temperature");

  const improvement =
    verification.rmseDmi !== null && verification.rmseMl !== null && verification.rmseDmi > 0
      ? ((verification.rmseDmi - verification.rmseMl) / verification.rmseDmi) * 100
      : null;

  const selectedTargets = sectionTargets[section];
  const bucketRows = leadBuckets
    .filter((bucket) => selectedTargets.includes(bucket.target))
    .map((bucket) => ({
      bucket:
        section === "temperature"
          ? bucket.label
          : `${getTargetLabel(targetLabels, bucket.target)} • ${bucket.label}`,
      dmi: bucket.baselineMetric,
      ml: bucket.mlMetric,
      improvementPct: bucket.improvementPct,
      target: bucket.target,
      bucketKey: bucket.bucket,
    }));

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
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Sådan læser du siden</CardTitle>
          <CardDescription>{explanations.performance}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-sm font-medium">DMI-prognose</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Den rå prognose, som alle sammenligninger starter fra.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-sm font-medium">ML-prognose</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Vores justerede bud for Aarhus, når der er en aktiv model.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-sm font-medium">Faktisk vejr</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Det vejr, der senere blev målt og brugt til at verificere prognoserne.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-500/40 dark:border-emerald-500/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{getReadableMetricName("winRate")}</p>
                <p className="mt-1 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {verification.winRate !== null ? `${verification.winRate.toFixed(1)}%` : "—"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Viser hvor ofte vores ML ramte nærmere virkeligheden end DMI&apos;s prognose.
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Award className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={verification.winRate ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{getReadableMetricName("mae")}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {verification.maeMl !== null ? `${verification.maeMl.toFixed(2)}` : "—"}
                  </p>
                  <p className="text-lg text-slate-400 line-through">
                    {verification.maeDmi !== null ? verification.maeDmi.toFixed(2) : "—"}
                  </p>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{getReadableMetricName("rmse")}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {verification.rmseMl !== null ? `${verification.rmseMl.toFixed(2)}` : "—"}
                  </p>
                  <p className="text-lg text-slate-400 line-through">
                    {verification.rmseDmi !== null ? verification.rmseDmi.toFixed(2) : "—"}
                  </p>
                </div>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                  {improvement !== null ? `${improvement.toFixed(1)}% bedre end DMI` : "Ingen temperatursammenligning endnu"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                <BarChart3 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["temperature", "wind", "rain"] as PerformanceSection[]).map((item) => (
          <Button
            key={item}
            variant={section === item ? "default" : "outline"}
            onClick={() => setSection(item)}
          >
            {sectionLabels[item]}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-500" />
            Historisk sammenligning: {sectionLabels[section]}
          </CardTitle>
          <CardDescription>
            Sammenlign DMI, ML og faktisk vejr i den seneste verificerede historik.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {section === "temperature" ? (
            temperatureSeries.length > 0 ? (
              <TimeSeriesChart data={temperatureSeries} suffix="°C" />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen verificeret temperaturhistorik endnu.</p>
            )
          ) : null}

          {section === "wind" ? (
            windSpeedSeries.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <TimeSeriesChart data={windSpeedSeries} suffix=" m/s" actualName="Faktisk vind" dmiName="DMI vind" mlName="ML vind" />
                <TimeSeriesChart data={windGustSeries} suffix=" m/s" actualName="Faktisk vindstød" dmiName="DMI vindstød" mlName="ML vindstød" />
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen verificeret vindhistorik endnu.</p>
            )
          ) : null}

          {section === "rain" ? (
            rainProbabilitySeries.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <TimeSeriesChart data={rainProbabilitySeries} suffix="%" yDomain={[0, 100]} actualName="Faktisk regn" dmiName="DMI regnrisiko" mlName="ML regnrisiko" />
                <TimeSeriesChart data={rainAmountSeries} suffix=" mm" actualName="Faktisk regnmængde" dmiName="DMI regnmængde" mlName="ML regnmængde" />
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen verificeret regnhistorik endnu.</p>
            )
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-slate-500" />
            Fejlanalyse: {sectionLabels[section]}
          </CardTitle>
          <CardDescription>
            Viser absolutte fejl for DMI og ML-prognoser sammenlignet med faktisk vejr. Lavere er bedre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {section === "temperature" ? (
            temperatureErrors.length > 0 ? (
              <ErrorChart data={temperatureErrors} title="Temperaturfejl (°C)" suffix="°C" />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen fejldata tilgængelig endnu.</p>
            )
          ) : null}

          {section === "wind" ? (
            windSpeedErrors.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <ErrorChart data={windSpeedErrors} title="Vindfejl (m/s)" suffix=" m/s" />
                <ErrorChart data={windGustErrors} title="Vindstødsfejl (m/s)" suffix=" m/s" />
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen fejldata tilgængelig endnu.</p>
            )
          ) : null}

          {section === "rain" ? (
            rainProbabilityErrors.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <ErrorChart data={rainProbabilityErrors} title="Regnrisikofejl (%-point)" suffix="%" yDomain={[0, 100]} />
                <ErrorChart data={rainAmountErrors} title="Regnmængdefejl (mm)" suffix=" mm" />
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen fejldata tilgængelig endnu.</p>
            )
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-500" />
            Performance pr. tidshorisont
          </CardTitle>
          <CardDescription>Se hvordan DMI og ML klarer sig på forskellige tidshorisonter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketRows} margin={{ top: 16, right: 24, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="bucket" tick={{ fontSize: 12 }} width={120} />
                <Tooltip content={<SeriesTooltip />} />
                <Bar dataKey="dmi" name="DMI-prognose" fill="#27D6F5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="ml" name="ML-prognose" fill="#F54927" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {bucketRows.map((bucket) => (
              <div
                key={`${bucket.target}-${bucket.bucketKey}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="whitespace-normal leading-relaxed">
                    {bucket.bucket}
                  </Badge>
                  <Badge variant="secondary" className="whitespace-normal leading-relaxed">
                    {getTargetLabel(targetLabels, bucket.target)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  DMI: {formatMetric(bucket.dmi, "", 3)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ML: {formatMetric(bucket.ml, "", 3)}
                </p>
                <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {bucket.improvementPct !== null ? `${bucket.improvementPct.toFixed(1)}%` : "Ingen gevinst"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-slate-500" />
              Hvad modellen lægger vægt på
            </CardTitle>
            <CardDescription>
              Det, som modellen lægger mest vægt på i sine beregninger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleFeatures.length > 0 ? (
              visibleFeatures.map((feature) => (
                <div key={`${feature.target}-${feature.feature}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {humanizeFeatureName(feature.feature)}{" "}
                      <span className="text-slate-400">({getFeatureTargetBadge(feature, targetLabels)})</span>
                    </span>
                    <span className="font-medium">{(feature.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                      style={{ width: `${Math.max(feature.importance * 100, 2)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Feature importance er ikke tilgængelig for dette signal endnu.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-slate-500" />
              Modelinfo og status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Sidste træning</span>
              </div>
              <span className="text-sm font-medium">
                {modelInfo.trainedAt ? formatDanishDateTime(modelInfo.trainedAt) : "Ukendt"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <span className="text-sm text-slate-600 dark:text-slate-400">Træningssamples</span>
              <span className="text-sm font-medium">
                {modelInfo.trainingSamples !== null ? modelInfo.trainingSamples.toLocaleString("da-DK") : "Ukendt"}
              </span>
            </div>
            <div className="space-y-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
              {selectedStatus.map(({ target, status }) => (
                <div key={target}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{getTargetLabel(targetLabels, target)}</span>
                    <Badge variant={status.hasActiveModel ? "default" : "secondary"}>
                      {status.statusLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{status.statusDescription}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Evalueringsperiode</p>
            <p className="text-xl font-semibold">{verification.periodLabel}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Punkter med facit</p>
            <p className="text-xl font-semibold">{verification.totalPredictions.toLocaleString("da-DK")}</p>
          </div>
          <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {verification.winRate !== null
              ? `ML var tættest på virkeligheden i ${verification.winRate.toFixed(0)}% af temperaturpunkterne`
              : "Snapshot mangler win-rate endnu"}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
