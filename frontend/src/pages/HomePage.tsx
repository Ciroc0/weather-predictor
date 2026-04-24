import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Cloud,
  CloudRain,
  CloudSun,
  CloudFog,
  CloudLightning,
  Droplets,
  Snowflake,
  Sun,
  ArrowRight,
  Thermometer,
  Wind,
  TrendingUp,
  Zap,
  Brain,
} from "lucide-react";

import { SeoHead } from "@/components/SeoHead";
import { WeatherHero } from "@/components/weather/WeatherHero";
import { Badge } from "@/components/ui/badge";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { homeSeo } from "@/lib/seo";
import {
  formatDanishTime,
  getAlertSummary,
  getForecastPreview,
  getTemperatureImprovementText,
} from "@/lib/weather";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { sharedTimeAxisProps } from "@/lib/chart";

const quickLinks = [
  {
    href: "/temperatur",
    label: "Temperatur",
    icon: Thermometer,
    description: "Sammenlign DMI med ML i forecast og historisk backtest.",
    color: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/20",
  },
  {
    href: "/vind",
    label: "Vind",
    icon: Wind,
    description: "Vindhastighed, vindstød og retning med lokale justeringer.",
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/20",
  },
  {
    href: "/regn",
    label: "Regn",
    icon: CloudRain,
    description: "Regnrisiko, regnmængde og tørre perioder.",
    color: "from-sky-500/20 to-cyan-500/10",
    iconColor: "text-sky-400",
    borderColor: "border-sky-500/20",
  },
];

function getWeatherIcon(code: number | null, className = "") {
  if (code === 0 || code === 1) return <Sun className={className} />;
  if (code === 2) return <CloudSun className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code !== null && code >= 45 && code <= 48) return <CloudFog className={className} />;
  if (code !== null && code >= 51 && code <= 55) return <Droplets className={className} />;
  if (code !== null && code >= 61 && code <= 65) return <CloudRain className={className} />;
  if (code !== null && code >= 71 && code <= 77) return <Snowflake className={className} />;
  if (code !== null && code >= 95) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

function getWeatherCardGradient(code: number | null): string {
  if (code === null) return "from-slate-500/10 to-transparent";
  if (code === 0 || code === 1) return "from-amber-500/15 to-transparent";
  if (code === 2) return "from-yellow-400/10 to-transparent";
  if (code >= 51) return "from-cyan-500/10 to-transparent";
  return "from-slate-500/10 to-transparent";
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/[0.12] bg-[#0f172a]/95 backdrop-blur-xl p-3 shadow-2xl">
      <p className="mb-2 font-medium text-white text-sm">{formatDanishTime(label || "")}</p>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-xs">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-aether-text-secondary">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value?.toFixed?.(1) || entry.value}°C</span>
        </div>
      ))}
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

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

      {/* Hero */}
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

      {/* Bento Grid */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {/* Main Chart - spans 3 columns */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3 glass-card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
            <div>
              <h2 className="section-title">Temperaturprognose</h2>
              <p className="text-xs text-aether-text-tertiary mt-1">Næste 48 timer • ML vs DMI</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="legend-item">
                <span className="legend-dot bg-cyan-400" />
                <span>ML</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot bg-coral" />
                <span>DMI</span>
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mlGradientHome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dmiGradientHome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis {...sharedTimeAxisProps} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(value) => `${value}°`}
                  domain={["dataMin - 2", "dataMax + 2"]}
                  stroke="rgba(255,255,255,0.06)"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="dmi"
                  name="DMI"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#dmiGradientHome)"
                  dot={{ r: 2, fill: "#f97316" }}
                />
                <Area
                  type="monotone"
                  dataKey="ml"
                  name="ML"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#mlGradientHome)"
                  dot={{ r: 2, fill: "#06b6d4" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Links - right column */}
        <motion.div variants={itemVariants} className="space-y-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} to={link.href} className="block group">
                <div className={`glass-card-hover p-5 h-full bg-gradient-to-br ${link.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${link.color} ${link.borderColor} border`}>
                      <Icon className={`h-5 w-5 ${link.iconColor}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-aether-text-tertiary group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{link.label}</h3>
                  <p className="text-xs text-aether-text-secondary leading-relaxed">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Weather Cards Grid */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-cyan-400" />
          <h2 className="section-title">Næste 12 timer</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {preview.map((hour, index) => {
            const Icon = getWeatherIcon(hour.weatherCode, "w-6 h-6");
            const isSunny = hour.weatherCode === 0 || hour.weatherCode === 1;
            const isCloudySun = hour.weatherCode === 2;
            const isRainy = hour.weatherCode !== null && hour.weatherCode >= 51;
            const iconColor = isSunny ? "text-amber-400" : isCloudySun ? "text-yellow-300" : isRainy ? "text-cyan-400" : "text-slate-400";
            const cardGradient = getWeatherCardGradient(hour.weatherCode);

            return (
              <motion.article
                key={hour.timestamp}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className={`glass-card-hover p-4 bg-gradient-to-b ${cardGradient}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-medium text-aether-text-secondary">{formatDanishTime(hour.timestamp)}</span>
                  <div className={iconColor}>{Icon}</div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)}°` : "—"}
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="text-aether-text-tertiary">ML {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <div className="h-1.5 w-1.5 rounded-full bg-coral" />
                    <span className="text-aether-text-tertiary">DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "—"}</span>
                  </div>
                </div>
                <p className="text-[11px] text-aether-text-tertiary mt-2">
                  Føles {hour.apparentTemp !== null ? `${Math.round(hour.apparentTemp)}°` : "—"}
                </p>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Info Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]"
      >
        {/* Hourly Detail Cards */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-400" />
              <h2 className="section-title">Detaljeret forecast</h2>
            </div>
            <Badge variant="outline" className="w-fit text-xs border-emerald-500/30 text-emerald-400 bg-emerald-400/10">
              <TrendingUp className="h-3 w-3 mr-1" />
              {getTemperatureImprovementText(snapshot.verification)}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {preview.slice(0, 6).map((hour) => (
              <div
                key={`detail-${hour.timestamp}`}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.1] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-medium text-aether-text-tertiary">{formatDanishTime(hour.timestamp)}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-5 px-1.5 ${
                      hour.effectiveTempSource === "ml"
                        ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
                        : "border-coral/30 text-coral bg-coral/10"
                    }`}
                  >
                    {hour.effectiveTempSource === "ml" ? "ML" : "DMI"}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white mb-2">
                  {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)}°` : "—"}
                </p>
                <div className="space-y-1 text-xs">
                  <p className="text-aether-text-secondary">
                    <span className="text-cyan-400">ML</span> {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "ikke aktiv"}
                  </p>
                  <p className="text-aether-text-secondary">
                    <span className="text-coral">DMI</span> {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "ingen data"}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1 text-[11px] text-aether-text-tertiary">
                  <p>Vind {hour.effectiveWindSpeed !== null ? `${hour.effectiveWindSpeed.toFixed(1)} m/s` : "—"}</p>
                  <p>Regn {hour.effectiveRainProb.toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Alerts */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vejrvarsler</h3>
            </div>
            <div className="space-y-3">
              {snapshot.alerts.length > 0 ? (
                snapshot.alerts.map((alert) => (
                  <div
                    key={`${alert.type}-${alert.title}`}
                    className={`rounded-xl border p-4 ${
                      alert.severity === "warning"
                        ? "border-rose-500/20 bg-rose-500/5"
                        : "border-amber-500/20 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 ${
                          alert.severity === "warning"
                            ? "border-rose-500/30 text-rose-400"
                            : "border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {alert.severity === "warning" ? "Advarsel" : "Info"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="text-xs text-aether-text-secondary mt-1">{alert.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                  <p className="text-sm text-aether-text-secondary">{getAlertSummary(snapshot)}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Model Info */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Om prognoserne</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-aether-text-secondary">Model opdateret</span>
                <span className="text-white font-medium">
                  {snapshot.modelInfo.trainedAt
                    ? new Date(snapshot.modelInfo.trainedAt).toLocaleDateString("da-DK")
                    : "Under udvikling"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-aether-text-secondary">Træningssamples</span>
                <span className="text-white font-medium">
                  {snapshot.modelInfo.trainingSamples?.toLocaleString("da-DK") || "—"}
                </span>
              </div>
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-xs text-aether-text-tertiary leading-relaxed">{snapshot.explanations.performance}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
