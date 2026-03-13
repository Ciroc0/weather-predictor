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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  formatDanishDateTime,
  formatMetric,
  formatShortDate,
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
import {
  ChartCard,
  ChartFrame,
  MetricCard,
  SectionBanner,
} from "@/components/weather/WeatherDisplay";

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

const comparisonLegend = [
  { label: "DMI", color: "#27D6F5" },
  { label: "ML", color: "#F54927" },
  { label: "Faktisk", color: "#0B2EF4" },
];

const errorLegend = [
  { label: "DMI fejl", color: "#27D6F5" },
  { label: "ML fejl", color: "#F54927" },
];

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
    <div className="max-w-[15rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-2 font-medium">{formatTooltipDateTime(label)}</p>
      <div className="space-y-1.5">
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
    </div>
  );
}

function ErrorTooltip({
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
    <div className="max-w-[15rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-2 font-medium">{formatTooltipDateTime(label)}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
            <span className="font-semibold">
              {entry.value.toFixed(2)}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function calculateErrors(
  history: DashboardHistory,
  section: PerformanceSection,
): Array<{ timeKey: string; dmiError: number | null; mlError: number | null }> {
  if (section === "temperature") {
    return history.temperature
      .filter((point) => point.actual !== null)
      .map((point) => ({
        timeKey: point.timestamp,
        dmiError: point.dmiTemp !== null ? Math.abs(point.dmiTemp - (point.actual ?? 0)) : null,
        mlError: point.mlTemp !== null ? Math.abs(point.mlTemp - (point.actual ?? 0)) : null,
      }));
  }
  if (section === "wind") {
    return history.wind
      .filter((point) => point.actualWindSpeed !== null)
      .map((point) => ({
        timeKey: point.timestamp,
        dmiError: point.dmiWindSpeed !== null ? Math.abs(point.dmiWindSpeed - (point.actualWindSpeed ?? 0)) : null,
        mlError: point.mlWindSpeed !== null ? Math.abs(point.mlWindSpeed - (point.actualWindSpeed ?? 0)) : null,
      }));
  }
  return history.rain
    .filter((point) => point.actualRainAmount !== null)
    .map((point) => ({
      timeKey: point.timestamp,
      dmiError: point.dmiRainAmount !== null ? Math.abs(point.dmiRainAmount - (point.actualRainAmount ?? 0)) : null,
      mlError: point.mlRainAmount !== null ? Math.abs(point.mlRainAmount - (point.actualRainAmount ?? 0)) : null,
    }));
}

function calculateWindGustErrors(history: DashboardHistory) {
  return history.wind
    .filter((point) => point.actualWindGust !== null)
    .map((point) => ({
      timeKey: point.timestamp,
      dmiError: point.dmiWindGust !== null ? Math.abs(point.dmiWindGust - (point.actualWindGust ?? 0)) : null,
      mlError: point.mlWindGust !== null ? Math.abs(point.mlWindGust - (point.actualWindGust ?? 0)) : null,
    }));
}

function calculateRainProbErrors(history: DashboardHistory) {
  return history.rain
    .filter((point) => point.actualRainEvent !== null)
    .map((point) => ({
      timeKey: point.timestamp,
      dmiError: point.dmiRainProb !== null ? Math.abs(point.dmiRainProb - (point.actualRainEvent ?? 0) * 100) : null,
      mlError: point.mlRainProb !== null ? Math.abs(point.mlRainProb - (point.actualRainEvent ?? 0) * 100) : null,
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
  const isMobile = useIsMobile();

  const improvement =
    verification.rmseDmi !== null && verification.rmseMl !== null && verification.rmseDmi > 0
      ? ((verification.rmseDmi - verification.rmseMl) / verification.rmseDmi) * 100
      : null;

  const selectedTargets = sectionTargets[section];
  const bucketRows = leadBuckets
    .filter((bucket) => selectedTargets.includes(bucket.target))
    .map((bucket) => ({
      bucket:
        section === "temperature" ? bucket.label : `${getTargetLabel(targetLabels, bucket.target)} • ${bucket.label}`,
      dmi: bucket.baselineMetric,
      ml: bucket.mlMetric,
      improvementPct: bucket.improvementPct,
      target: bucket.target,
    }));

  const visibleFeatures = useMemo(
    () =>
      featureImportance
        .filter((feature) => selectedTargets.includes(feature.target as ForecastTarget))
        .slice(0, 8),
    [featureImportance, selectedTargets],
  );

  const selectedStatus = selectedTargets.map((target) => ({
    target,
    status: targetStatus[target],
  }));

  const errorData = useMemo(() => calculateErrors(history, section), [history, section]);
  const rainProbErrorData = useMemo(() => calculateRainProbErrors(history), [history]);
  const windGustErrorData = useMemo(() => calculateWindGustErrors(history), [history]);

  const historyInterval = isMobile ? 10 : 5;
  const chartMargin = { top: 12, right: 12, left: isMobile ? -20 : -8, bottom: isMobile ? 20 : 8 };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="page-stack">
      <SectionBanner
        eyebrow="Modelperformance"
        title="Start med tre hurtige svar"
        description={explanations.performance}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Award className="h-4 w-4" />}
          label={getReadableMetricName("winRate")}
          value={verification.winRate !== null ? `${verification.winRate.toFixed(1)}%` : "—"}
          detail="Viser hvor ofte ML ramte taettere paa virkeligheden end DMI."
          emphasis={verification.winRate !== null && verification.winRate >= 50 ? "accent" : "default"}
        />
        <MetricCard
          icon={<Target className="h-4 w-4" />}
          label={getReadableMetricName("mae")}
          value={verification.maeMl !== null ? verification.maeMl.toFixed(2) : "—"}
          detail={
            verification.maeDmi !== null
              ? `DMI laa paa ${verification.maeDmi.toFixed(2)} i samme periode.`
              : "Ingen DMI-sammenligning endnu."
          }
        />
        <MetricCard
          icon={<BarChart3 className="h-4 w-4" />}
          label={getReadableMetricName("rmse")}
          value={verification.rmseMl !== null ? verification.rmseMl.toFixed(2) : "—"}
          detail={
            improvement !== null
              ? `${improvement.toFixed(1)}% bedre end DMI i den seneste evalueringsperiode.`
              : "Forbedringen i forhold til DMI er endnu ikke dokumenteret."
          }
        />
      </div>

      <section className="section-stack">
        <div className="space-y-3">
          <p className="section-eyebrow">Vaelg signal</p>
          <div className="flex flex-wrap gap-2">
            {(["temperature", "wind", "rain"] as PerformanceSection[]).map((item) => (
              <Button
                key={item}
                variant={section === item ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setSection(item)}
              >
                {sectionLabels[item]}
              </Button>
            ))}
          </div>
        </div>

        <ChartCard
          title={`Historisk sammenligning for ${sectionLabels[section].toLowerCase()}`}
          description="Her ser du tidligere prognoser holdt op mod det vejr, der faktisk blev målt."
          legend={comparisonLegend}
        >
          {section === "temperature" ? (
            history.temperature.length > 0 ? (
              <ChartFrame>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={history.temperature.map((point) => ({
                      timeKey: point.timestamp,
                      dmi: point.dmiTemp,
                      ml: point.mlTemp,
                      actual: point.actual,
                    }))}
                    margin={chartMargin}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                    <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<HistoryTooltip suffix="°C" />} />
                    <Line type="monotone" dataKey="dmi" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                    <Line type="monotone" dataKey="ml" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                    <Line type="monotone" dataKey="actual" name="Faktisk" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartFrame>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen verificeret temperaturhistorik endnu.</p>
            )
          ) : null}

          {section === "wind" ? (
            history.wind.length > 0 ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <ChartFrame className="lg:h-[20rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history.wind.map((point) => ({
                        timeKey: point.timestamp,
                        dmi: point.dmiWindSpeed,
                        ml: point.mlWindSpeed,
                        actual: point.actualWindSpeed,
                      }))}
                      margin={chartMargin}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<HistoryTooltip suffix=" m/s" />} />
                      <Line type="monotone" dataKey="dmi" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                      <Line type="monotone" dataKey="ml" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                      <Line type="monotone" dataKey="actual" name="Faktisk" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
                <ChartFrame className="lg:h-[20rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history.wind.map((point) => ({
                        timeKey: point.timestamp,
                        dmi: point.dmiWindGust,
                        ml: point.mlWindGust,
                        actual: point.actualWindGust,
                      }))}
                      margin={chartMargin}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<HistoryTooltip suffix=" m/s" />} />
                      <Line type="monotone" dataKey="dmi" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                      <Line type="monotone" dataKey="ml" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                      <Line type="monotone" dataKey="actual" name="Faktisk" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen verificeret vindhistorik endnu.</p>
            )
          ) : null}

          {section === "rain" ? (
            history.rain.length > 0 ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <ChartFrame className="lg:h-[20rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history.rain.map((point) => ({
                        timeKey: point.timestamp,
                        dmi: point.dmiRainProb,
                        ml: point.mlRainProb,
                        actual: point.actualRainEvent !== null ? point.actualRainEvent * 100 : null,
                      }))}
                      margin={chartMargin}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip content={<HistoryTooltip suffix="%" />} />
                      <Line type="monotone" dataKey="dmi" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                      <Line type="monotone" dataKey="ml" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                      <Line type="monotone" dataKey="actual" name="Faktisk" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
                <ChartFrame className="lg:h-[20rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={history.rain.map((point) => ({
                        timeKey: point.timestamp,
                        dmi: point.dmiRainAmount,
                        ml: point.mlRainAmount,
                        actual: point.actualRainAmount,
                      }))}
                      margin={chartMargin}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<HistoryTooltip suffix=" mm" />} />
                      <Line type="monotone" dataKey="dmi" name="DMI" stroke="#27D6F5" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                      <Line type="monotone" dataKey="ml" name="ML" stroke="#F54927" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                      <Line type="monotone" dataKey="actual" name="Faktisk" stroke="#0B2EF4" strokeWidth={3} dot={false} strokeOpacity={0.95} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen verificeret regnhistorik endnu.</p>
            )
          ) : null}
        </ChartCard>

        <ChartCard
          title={`Fejlanalyse for ${sectionLabels[section].toLowerCase()}`}
          description="Lavere fejl er bedre. Disse grafer viser den absolutte afstand mellem prognosen og det vejr, der faktisk kom."
          legend={errorLegend}
        >
          {section === "temperature" ? (
            errorData.length > 0 ? (
              <ChartFrame>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={errorData} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                    <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
                    <Tooltip content={<ErrorTooltip suffix="°C" />} />
                    <Area type="monotone" dataKey="dmiError" name="DMI fejl" stroke="#27D6F5" fill="#27D6F5" fillOpacity={0.28} strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="mlError" name="ML fejl" stroke="#F54927" fill="#F54927" fillOpacity={0.25} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartFrame>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen fejldata tilgaengelig endnu.</p>
            )
          ) : null}

          {section === "wind" ? (
            errorData.length > 0 || windGustErrorData.length > 0 ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <ChartFrame className="lg:h-[20rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={errorData} margin={chartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
                      <Tooltip content={<ErrorTooltip suffix=" m/s" />} />
                      <Area type="monotone" dataKey="dmiError" name="DMI fejl" stroke="#27D6F5" fill="#27D6F5" fillOpacity={0.28} strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="mlError" name="ML fejl" stroke="#F54927" fill="#F54927" fillOpacity={0.25} strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartFrame>
                <ChartFrame className="lg:h-[20rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={windGustErrorData} margin={chartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => Number(value).toFixed(1)} />
                      <Tooltip content={<ErrorTooltip suffix=" m/s" />} />
                      <Area type="monotone" dataKey="dmiError" name="DMI fejl" stroke="#27D6F5" fill="#27D6F5" fillOpacity={0.28} strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="mlError" name="ML fejl" stroke="#F54927" fill="#F54927" fillOpacity={0.25} strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen fejldata tilgaengelig endnu.</p>
            )
          ) : null}

          {section === "rain" ? (
            rainProbErrorData.length > 0 || errorData.length > 0 ? (
              <div className="grid gap-6 xl:grid-cols-2">
                <ChartFrame className="lg:h-[20rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rainProbErrorData} margin={chartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip content={<ErrorTooltip suffix="%" />} />
                      <Area type="monotone" dataKey="dmiError" name="DMI fejl" stroke="#27D6F5" fill="#27D6F5" fillOpacity={0.28} strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="mlError" name="ML fejl" stroke="#F54927" fill="#F54927" fillOpacity={0.25} strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartFrame>
                <ChartFrame className="lg:h-[20rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={errorData} margin={chartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis dataKey="timeKey" tick={{ fontSize: 11 }} tickFormatter={(value: string) => formatShortDate(value)} tickMargin={10} interval={historyInterval} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<ErrorTooltip suffix=" mm" />} />
                      <Area type="monotone" dataKey="dmiError" name="DMI fejl" stroke="#27D6F5" fill="#27D6F5" fillOpacity={0.28} strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="mlError" name="ML fejl" stroke="#F54927" fill="#F54927" fillOpacity={0.25} strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">Ingen fejldata tilgaengelig endnu.</p>
            )
          ) : null}
        </ChartCard>

        <ChartCard
          title="Performance pr. tidshorisont"
          description="Sammenlign DMI og ML paa korte og lange prognosevinduer."
        >
          <ChartFrame className="lg:h-[21rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketRows} margin={{ top: 16, right: 20, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="bucket" tick={{ fontSize: 12 }} width={isMobile ? 118 : 190} />
                <Tooltip content={<HistoryTooltip />} />
                <Bar dataKey="dmi" name="DMI" fill="#27D6F5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="ml" name="ML" fill="#F54927" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {bucketRows.map((bucket) => (
              <div key={`${bucket.target}-${bucket.bucket}`} className="soft-surface min-w-0 p-4">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <Badge variant="outline" className="min-w-0">
                    {bucket.bucket}
                  </Badge>
                  <Badge variant="secondary">{getTargetLabel(targetLabels, bucket.target)}</Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <p>DMI: {formatMetric(bucket.dmi, "", 3)}</p>
                  <p>ML: {formatMetric(bucket.ml, "", 3)}</p>
                </div>
                <p className="mt-3 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {bucket.improvementPct !== null ? `${bucket.improvementPct.toFixed(1)}%` : "Ingen gevinst"}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Hvad modellen laegger vaegt paa"
          description="De vigtigste input bag modellens vurdering for den valgte kategori."
        >
          {visibleFeatures.length > 0 ? (
            <div className="space-y-3">
              {visibleFeatures.map((feature) => (
                <div key={`${feature.target}-${feature.feature}`} className="space-y-2">
                  <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      {humanizeFeatureName(feature.feature)}{" "}
                      <span className="text-slate-400">({getFeatureTargetBadge(feature, targetLabels)})</span>
                    </span>
                    <span className="shrink-0 font-medium">{(feature.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                      style={{ width: `${Math.max(feature.importance * 100, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Feature importance er ikke tilgaengelig for dette signal endnu.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Modelinfo og status"
          description="Her ser du hvornår modellerne sidst blev traenet, og hvilke signaler der er aktive lige nu."
        >
          <div className="grid gap-3">
            <div className="soft-surface flex min-w-0 items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                Sidste traening
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {modelInfo.trainedAt ? formatDanishDateTime(modelInfo.trainedAt) : "Ukendt"}
              </span>
            </div>
            <div className="soft-surface flex min-w-0 items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Cpu className="h-4 w-4" />
                Traeningssamples
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {modelInfo.trainingSamples !== null ? modelInfo.trainingSamples.toLocaleString("da-DK") : "Ukendt"}
              </span>
            </div>
            <div className="soft-surface space-y-3 p-4">
              {selectedStatus.map(({ target, status }) => (
                <div key={target} className="min-w-0">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {getTargetLabel(targetLabels, target)}
                    </span>
                    <Badge variant={status.hasActiveModel ? "default" : "secondary"}>{status.statusLabel}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{status.statusDescription}</p>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="panel-card rounded-[1.5rem] bg-gradient-to-r from-slate-50 to-slate-100 py-0 dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-3">
          <MetricCard
            icon={<CheckCircle className="h-4 w-4" />}
            label="Evalueringsperiode"
            value={verification.periodLabel}
            detail="Den periode som de viste fejltal og win rates er baseret paa."
            className="border-0 bg-transparent shadow-none"
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Punkter med facit"
            value={verification.totalPredictions.toLocaleString("da-DK")}
            detail="Antal prognosepunkter hvor vi efterfoelgende kender det faktiske vejr."
            className="border-0 bg-transparent shadow-none"
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Kort fortalt"
            value={verification.winRate !== null ? `${verification.winRate.toFixed(0)}%` : "Ingen win rate"}
            detail={
              verification.winRate !== null
                ? `ML var taettest paa virkeligheden i ${verification.winRate.toFixed(0)}% af de sammenlignelige punkter.`
                : "Snapshot mangler endnu win-rate data."
            }
            className="border-0 bg-transparent shadow-none"
          />
        </div>
        <div className="px-6 pb-6">
          <Progress value={verification.winRate ?? 0} className="h-2.5" />
        </div>
      </div>
    </motion.div>
  );
}
