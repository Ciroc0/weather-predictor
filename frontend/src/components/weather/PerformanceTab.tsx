import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Cpu,
  Target,
  TrendingUp,
} from "lucide-react";
import {
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatDanishDateTime,
  formatMetric,
  formatShortDate,
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

function HistoryTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
          <span className="font-semibold">
            {entry.value.toFixed(1)}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Saadan laeser du siden</CardTitle>
          <CardDescription>{explanations.performance}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-sm font-medium">DMI-prognose</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Den raa prognose, som alle sammenligninger starter fra.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-sm font-medium">ML-prognose</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Vores justerede bud for Aarhus, naar der er en aktiv model.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-sm font-medium">Faktisk vejr</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Det vejr, der senere blev maalt og brugt til at verificere prognoserne.
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
                  Gaaelder for temperatur, hvor der er flest verificerede sammenligninger lige nu.
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
            history.temperature.length > 0 ? (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={history.temperature.map((point) => ({
                      time: formatShortDate(point.timestamp),
                      dmi: point.dmiTemp,
                      ml: point.mlTemp,
                      actual: point.actualTemp,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<HistoryTooltip suffix="°C" />} />
                    <Line type="monotone" dataKey="dmi" name="DMI-prognose" stroke="#64748b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ml" name="ML-prognose" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="actual" name="Faktisk vejr" stroke="#111827" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen verificeret temperaturhistorik endnu.</p>
            )
          ) : null}

          {section === "wind" ? (
            history.wind.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history.wind.map((point) => ({
                        time: formatShortDate(point.timestamp),
                        dmi: point.dmiWindSpeed,
                        ml: point.mlWindSpeed,
                        actual: point.actualWindSpeed,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<HistoryTooltip suffix=" m/s" />} />
                      <Line type="monotone" dataKey="dmi" name="DMI vind" stroke="#64748b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ml" name="ML vind" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="actual" name="Faktisk vind" stroke="#111827" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history.wind.map((point) => ({
                        time: formatShortDate(point.timestamp),
                        dmi: point.dmiWindGust,
                        ml: point.mlWindGust,
                        actual: point.actualWindGust,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<HistoryTooltip suffix=" m/s" />} />
                      <Line type="monotone" dataKey="dmi" name="DMI vindstoed" stroke="#64748b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ml" name="ML vindstoed" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="actual" name="Faktisk vindstoed" stroke="#111827" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen verificeret vindhistorik endnu.</p>
            )
          ) : null}

          {section === "rain" ? (
            history.rain.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history.rain.map((point) => ({
                        time: formatShortDate(point.timestamp),
                        dmi: point.dmiRainProb,
                        ml: point.mlRainProb,
                        actual: point.actualRainEvent !== null ? point.actualRainEvent * 100 : null,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip content={<HistoryTooltip suffix="%" />} />
                      <Line type="monotone" dataKey="dmi" name="DMI regnrisiko" stroke="#64748b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ml" name="ML regnrisiko" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="actual" name="Faktisk regn" stroke="#111827" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history.rain.map((point) => ({
                        time: formatShortDate(point.timestamp),
                        dmi: point.dmiRainAmount,
                        ml: point.mlRainAmount,
                        actual: point.actualRainAmount,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} tickMargin={8} interval={5} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<HistoryTooltip suffix=" mm" />} />
                      <Line type="monotone" dataKey="dmi" name="DMI regnmaengde" stroke="#64748b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ml" name="ML regnmaengde" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="actual" name="Faktisk regnmaengde" stroke="#111827" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
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
            <BarChart3 className="h-5 w-5 text-slate-500" />
            Performance pr. tidshorisont
          </CardTitle>
          <CardDescription>DMI-prognose og ML sammenlignes inden for samme tidshorisont.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketRows} margin={{ top: 16, right: 24, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="bucket" tick={{ fontSize: 12 }} width={160} />
                <Tooltip content={<HistoryTooltip />} />
                <Bar dataKey="dmi" name="DMI-prognose" fill="#64748b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="ml" name="ML-prognose" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {bucketRows.map((bucket) => (
              <div
                key={`${bucket.target}-${bucket.bucket}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{bucket.bucket}</Badge>
                  <Badge variant="secondary">{getTargetLabel(targetLabels, bucket.target)}</Badge>
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
              Hvad modellen laegger vaegt paa
            </CardTitle>
            <CardDescription>
              De vigtigste input for den valgte del af produktet.
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
                Feature importance er ikke tilgaengelig for dette signal endnu.
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
                <span className="text-sm text-slate-600 dark:text-slate-400">Sidste traening</span>
              </div>
              <span className="text-sm font-medium">
                {modelInfo.trainedAt ? formatDanishDateTime(modelInfo.trainedAt) : "Ukendt"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <span className="text-sm text-slate-600 dark:text-slate-400">Traeningssamples</span>
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
          <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {verification.winRate !== null
              ? `ML var taettest paa virkeligheden i ${verification.winRate.toFixed(0)}% af temperaturpunkterne`
              : "Snapshot mangler win-rate endnu"}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
