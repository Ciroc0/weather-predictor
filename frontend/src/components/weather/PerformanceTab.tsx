import { motion } from "framer-motion";
import { Award, BarChart3, Calendar, CheckCircle, Cpu, Target, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDanishDateTime } from "@/lib/weather";
import type { FeatureImportance, LeadBucketPerformance, ModelInfo, VerificationMetrics } from "@/types/weather";

interface PerformanceTabProps {
  verification: VerificationMetrics;
  leadBuckets: LeadBucketPerformance[];
  featureImportance: FeatureImportance[];
  modelInfo: ModelInfo;
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

export function PerformanceTab({ verification, leadBuckets, featureImportance, modelInfo }: PerformanceTabProps) {
  const improvement =
    verification.rmseDmi !== null && verification.rmseMl !== null && verification.rmseDmi > 0
      ? ((verification.rmseDmi - verification.rmseMl) / verification.rmseDmi) * 100
      : null;

  const bucketRows = leadBuckets.map((bucket) => ({
    bucket: bucket.label,
    dmi: bucket.baselineMetric,
    ml: bucket.mlMetric,
  }));

  const topFeatures = featureImportance.slice(0, 8);

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
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 font-medium">{label}</p>
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
            <span className="font-semibold">{entry.value.toFixed(3)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-500/40 dark:border-emerald-500/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Win-rate</p>
                <p className="mt-1 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {verification.winRate !== null ? `${verification.winRate.toFixed(1)}%` : "—"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Andel hvor ML slår DMI på temperatur</p>
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
                <p className="text-sm text-slate-500 dark:text-slate-400">MAE</p>
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
                <p className="text-sm text-slate-500 dark:text-slate-400">RMSE</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {verification.rmseMl !== null ? `${verification.rmseMl.toFixed(2)}` : "—"}
                  </p>
                  <p className="text-lg text-slate-400 line-through">
                    {verification.rmseDmi !== null ? verification.rmseDmi.toFixed(2) : "—"}
                  </p>
                </div>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                  {improvement !== null ? `${improvement.toFixed(1)}% bedre end DMI` : "Ingen RMSE-sammenligning endnu"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                <BarChart3 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-500" />
            Performance pr. lead-bucket
          </CardTitle>
          <CardDescription>Baseret på registry-summary fra de aktive bucket-modeller.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketRows} margin={{ top: 16, right: 24, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="bucket" tick={{ fontSize: 12 }} width={86} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="dmi" name="Baseline" fill="#64748b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="ml" name="ML" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {leadBuckets.map((bucket) => (
              <div
                key={`${bucket.target}-${bucket.bucket}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{bucket.label}</Badge>
                  <Badge variant="secondary">{bucket.target}</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Baseline: {bucket.baselineMetric !== null ? bucket.baselineMetric.toFixed(3) : "—"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ML: {bucket.mlMetric !== null ? bucket.mlMetric.toFixed(3) : "—"}
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
              Feature importance
            </CardTitle>
            <CardDescription>Top features på tværs af de aktive modelbundles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topFeatures.length > 0 ? (
              topFeatures.map((feature) => (
                <div key={`${feature.target}-${feature.feature}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {feature.feature} <span className="text-slate-400">({feature.target})</span>
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
              <p className="text-sm text-slate-600 dark:text-slate-400">Feature importance er ikke tilgængelig i snapshot endnu.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-slate-500" />
              Modelinfo
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
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">Aktive targets</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {modelInfo.targets.map((target) => (
                  <Badge key={target} variant="outline">
                    {target}
                  </Badge>
                ))}
              </div>
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Verificerede prediction points</p>
            <p className="text-xl font-semibold">{verification.totalPredictions.toLocaleString("da-DK")}</p>
          </div>
          <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {verification.winRate !== null ? `ML slår DMI i ${verification.winRate.toFixed(0)}% af tilfældene` : "Snapshot mangler win-rate"}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
