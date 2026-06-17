import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CloudRain, Gauge, Thermometer, Wind } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SeoHead } from "@/components/SeoHead";
import { WeatherHero } from "@/components/weather/WeatherHero";
import { Badge } from "@/components/ui/badge";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { sharedTimeAxisProps } from "@/lib/chart";
import { homeSeo } from "@/lib/seo";
import { formatDanishTime, getAlertSummary, getForecastPreview, getTemperatureImprovementText } from "@/lib/weather";

const links = [
  { href: "/temperatur", label: "Temperatur", icon: Thermometer },
  { href: "/vind", label: "Vind", icon: Wind },
  { href: "/regn", label: "Regn", icon: CloudRain },
];

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="chart-tooltip">
      <p className="mb-2 text-sm font-medium text-white">{formatDanishTime(label || "")}</p>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-[#9aa3ad]">{entry.name}</span>
          <span className="font-semibold text-white">{entry.value?.toFixed?.(1) ?? entry.value} C</span>
        </div>
      ))}
    </div>
  );
}

function ForecastMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#68717b]">{label}</p>
      <p className="mt-1 text-xs font-medium text-[#d8dde3]">{value}</p>
    </div>
  );
}

export function HomePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;
  const preview = getForecastPreview(snapshot.forecast, 12);

  const chartData = snapshot.forecast.slice(0, 48).map((hour) => ({
    timeKey: hour.timestamp,
    ml: hour.mlTemp,
    dmi: hour.dmiTemp,
    effective: hour.effectiveTemp,
  }));

  return (
    <div className="space-y-8">
      <SeoHead config={homeSeo} />

      <WeatherHero
        current={snapshot.current}
        generatedAt={snapshot.generatedAt}
        summaryText={snapshot.explanations.sources}
        statusText={
          response.stale
            ? "Viser seneste cachede snapshot fra Hugging Face."
            : "Live snapshot fra Hugging Face med DMI, ML og verifikation."
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="glass-card p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="metric-label">Forecast</p>
              <h2 className="section-title mt-1">Temperatur / naeste 48 timer</h2>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="legend-item"><span className="legend-dot bg-[#11c5d6]" /> ML</span>
              <span className="legend-item"><span className="legend-dot bg-[#9aa3ad]" /> DMI</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#747d87" }}
                  tickFormatter={(value) => `${value} C`}
                  domain={["dataMin - 2", "dataMax + 2"]}
                  stroke="rgba(255,255,255,0.1)"
                />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="dmi" name="DMI" stroke="#9aa3ad" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ml" name="ML" stroke="#11c5d6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} to={link.href} className="glass-card-hover block p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.08] bg-[#0c0e11]">
                      <Icon className="h-4 w-4 text-[#11c5d6]" />
                    </span>
                    <span className="text-sm font-semibold text-white">{link.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#747d87]" />
                </div>
              </Link>
            );
          })}
          <div className="glass-card p-4">
            <p className="metric-label">Verifikation</p>
            <p className="mt-2 text-sm leading-6 text-[#d8dde3]">{getTemperatureImprovementText(snapshot.verification)}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#11c5d6]" />
          <h2 className="section-title">Naeste 12 timer</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {preview.map((hour, index) => (
            <motion.article
              key={hour.timestamp}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.02 }}
              className="glass-card-hover p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#747d87]">{formatDanishTime(hour.timestamp)}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)} C` : "--"}
                  </p>
                </div>
                <Badge variant="outline" className="border-[#11c5d6]/40 bg-transparent text-[10px] text-[#11c5d6]">
                  +{hour.leadTimeHours ?? 0}h
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-4">
                <ForecastMeta label="ML temp" value={hour.mlTemp !== null ? `${Math.round(hour.mlTemp)} C` : "Ikke aktiv"} />
                <ForecastMeta label="DMI temp" value={hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)} C` : "Ingen data"} />
                <ForecastMeta label="Humidity" value={hour.humidity === null ? "--" : `${hour.humidity.toFixed(0)}%`} />
                <ForecastMeta label="Pressure" value={hour.pressure === null ? "--" : `${hour.pressure.toFixed(0)} hPa`} />
                <ForecastMeta label="Cloud" value={hour.cloudCover === null ? "--" : `${hour.cloudCover.toFixed(0)}%`} />
                <ForecastMeta label="Regn" value={`${hour.effectiveRainProb.toFixed(0)}% / ${hour.effectiveRainAmount.toFixed(1)} mm`} />
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <div className="glass-card p-5">
          <p className="metric-label">Alerts</p>
          <div className="mt-4 space-y-3">
            {snapshot.alerts.length > 0 ? (
              snapshot.alerts.map((alert) => (
                <div key={`${alert.type}-${alert.title}`} className="rounded-md border border-white/[0.08] bg-[#0c0e11] p-4">
                  <p className="text-sm font-semibold text-white">{alert.title}</p>
                  <p className="mt-1 text-sm text-[#9aa3ad]">{alert.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#9aa3ad]">{getAlertSummary(snapshot)}</p>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="metric-label">Modelmetadata</p>
          <div className="mt-4 grid gap-3">
            <ForecastMeta
              label="Sidste traening"
              value={snapshot.modelInfo.trainedAt ? new Date(snapshot.modelInfo.trainedAt).toLocaleDateString("da-DK") : "Under udvikling"}
            />
            <ForecastMeta
              label="Samples"
              value={snapshot.modelInfo.trainingSamples?.toLocaleString("da-DK") || "--"}
            />
            <ForecastMeta label="Targets" value={snapshot.modelInfo.targets.join(", ")} />
            <ForecastMeta label="Registry" value={snapshot.modelInfo.registryGeneratedAt || "--"} />
          </div>
        </div>
      </section>
    </div>
  );
}
