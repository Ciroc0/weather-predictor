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
} from "lucide-react";

import { SeoHead } from "@/components/SeoHead";
import { WeatherHero } from "@/components/weather/WeatherHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { homeSeo } from "@/lib/seo";
import {
  formatDanishDate,
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
    description:
      "Se temperaturprognosen for Aarhus og sammenlign DMI med ML i både forecast og historisk backtest.",
  },
  {
    href: "/vind",
    label: "Vind",
    icon: Wind,
    description:
      "Få overblik over vindhastighed, vindstød og vindretning i Aarhus med lokale modeljusteringer.",
  },
  {
    href: "/regn",
    label: "Regn",
    icon: CloudRain,
    description:
      "Følg regnrisiko, regnmængde og mulige tørre perioder i Aarhus med DMI og ML side om side.",
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
    <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-3 shadow-xl">
      <p className="mb-2 font-medium text-dashboard-text">{formatDanishTime(label || "")}</p>
      {payload.map((entry) => (
        <div key={`${entry.name}-${entry.value}`} className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-dashboard-text-muted">{entry.name}:</span>
          <span className="font-semibold text-dashboard-text">{entry.value?.toFixed?.(1) || entry.value}°C</span>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;
  const preview = getForecastPreview(snapshot.forecast, 12);

  // Prepare chart data
  const chartData = snapshot.forecast.slice(0, 48).map((hour) => ({
    timeKey: hour.timestamp,
    ml: hour.mlTemp,
    dmi: hour.dmiTemp,
    effective: hour.effectiveTemp,
  }));

  return (
    <div className="space-y-8">
      <SeoHead config={homeSeo} />

      {/* Header Section */}
      <section className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-dashboard-text">Aarhus Vejr Dashboard Dark V2</h1>
        <p className="text-dashboard-text-muted max-w-3xl mx-auto text-sm leading-relaxed">
          Sammenligning af ML-modeller og DMI's vejrprognoser for Aarhus. Se temperatur, vind og regn 
          med forudsigelser for de næste 48 timer baseret på avancerede modeller og meteorologiske data.
        </p>
      </section>

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

      {/* Main Chart Section */}
      <section className="dashboard-card-flat">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold text-dashboard-text">Temperaturprognose for Aarhus - næste 48 timer</h2>
          <div className="flex gap-4 text-xs">
            <div className="legend-item">
              <span className="legend-dot bg-dashboard-ml/80"></span>
              <span>ML Prognose</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot bg-dashboard-dmi/80"></span>
              <span>DMI Data</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot border border-dashboard-border bg-transparent"></span>
              <span>Faktisk Data</span>
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="dmiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis {...sharedTimeAxisProps} />
              <YAxis 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
                tickFormatter={(value) => `${value}°`} 
                domain={["dataMin - 2", "dataMax + 2"]}
                stroke="#334155"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="dmi"
                name="DMI"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#dmiGradient)"
                dot={{ r: 3, fill: "#f97316" }}
              />
              <Area
                type="monotone"
                dataKey="ml"
                name="ML"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#mlGradient)"
                dot={{ r: 3, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Weather Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {preview.map((hour, index) => {
          const Icon = getWeatherIcon(hour.weatherCode, "w-8 h-8");
          const isSunny = hour.weatherCode === 0 || hour.weatherCode === 1;
          const isCloudySun = hour.weatherCode === 2;
          const isRainy = hour.weatherCode !== null && hour.weatherCode >= 51;
          
          const iconColor = isSunny ? "text-yellow-400" : isCloudySun ? "text-yellow-300" : isRainy ? "text-blue-400" : "text-gray-400";
          
          return (
            <motion.article
              key={hour.timestamp}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="weather-card"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-dashboard-text">{formatDanishTime(hour.timestamp)}</span>
                <div className={iconColor}>{Icon}</div>
              </div>
              <div className="space-y-1 text-sm mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-dashboard-ml font-medium">
                    ML: {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°C` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-dashboard-dmi font-medium">
                    DMI: {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°C` : "—"}
                  </span>
                </div>
                <div className="text-right text-dashboard-text-muted text-xs mt-1">
                  Føles som {hour.apparentTemp !== null ? `${Math.round(hour.apparentTemp)}°` : "—"}
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      {/* Quick Links */}
      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} to={link.href}>
              <Card className="h-full dashboard-card-flat transition-all hover:border-dashboard-text-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg text-dashboard-text">{link.label}</CardTitle>
                  <Icon className="h-5 w-5 text-dashboard-text-muted" />
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 text-sm text-dashboard-text-muted">
                  <span>{link.description}</span>
                  <ArrowRight className="h-4 w-4 flex-none" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      {/* Info Cards */}
      <section className="grid gap-6 lg:items-start lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="self-start dashboard-card-flat">
          <CardHeader>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-dashboard-text">Næste 12 timer i Aarhus</CardTitle>
              <Badge variant="secondary" className="max-w-full whitespace-normal text-left leading-relaxed bg-dashboard-border text-dashboard-text">
                {getTemperatureImprovementText(snapshot.verification)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {preview.slice(0, 6).map((hour) => (
              <div
                key={`detail-${hour.timestamp}`}
                className="rounded-xl border border-dashboard-border bg-dashboard-card p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <p className="text-xs text-dashboard-text-muted">kl. {formatDanishTime(hour.timestamp)}</p>
                  <Badge
                    variant={hour.effectiveTempSource === "ml" ? "default" : "secondary"}
                    className={`h-4 min-w-0 px-1 py-0 text-[9px] ${hour.effectiveTempSource === "ml" ? "bg-dashboard-ml" : "bg-dashboard-border"}`}
                  >
                    {hour.effectiveTempSource === "ml" ? "ML" : "DMI"}
                  </Badge>
                </div>
                <p className="mt-2 text-2xl font-semibold text-dashboard-text">
                  {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)}°` : "—"}
                </p>
                <p className="text-xs text-dashboard-text-muted">
                  ML {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "ikke aktiv"}
                </p>
                <p className="text-xs text-dashboard-text-muted">
                  DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "ingen data"}
                </p>
                <p className="mt-3 text-xs text-dashboard-text-muted">
                  Vind {hour.effectiveWindSpeed !== null ? `${hour.effectiveWindSpeed.toFixed(1)} m/s` : "—"}
                </p>
                <p className="text-xs text-dashboard-text-muted">
                  Regn {hour.effectiveRainProb.toFixed(0)}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6 self-start">
          <Card className="dashboard-card-flat">
            <CardHeader>
              <CardTitle className="text-dashboard-text">Vejrvarsler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.alerts.length > 0 ? (
                snapshot.alerts.map((alert) => (
                  <div
                    key={`${alert.type}-${alert.title}`}
                    className="rounded-xl border border-dashboard-border bg-dashboard-card p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === "warning" ? "destructive" : "secondary"}>
                        {alert.severity === "warning" ? "Advarsel" : "Info"}
                      </Badge>
                      <p className="font-medium text-dashboard-text">{alert.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-dashboard-text-muted">{alert.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-dashboard-text-muted">{getAlertSummary(snapshot)}</p>
              )}
            </CardContent>
          </Card>

          <Card className="dashboard-card-flat">
            <CardHeader>
              <CardTitle className="text-dashboard-text">Om prognoserne</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-dashboard-text-muted">
              <p>
                Seneste modelopdatering:{" "}
                {snapshot.modelInfo.trainedAt
                  ? formatDanishDate(snapshot.modelInfo.trainedAt)
                  : "Under udvikling"}
              </p>
              <p>
                Antal vejrobservationer brugt til træning:{" "}
                {snapshot.modelInfo.trainingSamples?.toLocaleString("da-DK") || "Ikke tilgængelig endnu"}
              </p>
              <p>{snapshot.explanations.performance}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
