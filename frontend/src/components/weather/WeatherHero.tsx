import { motion } from "framer-motion";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Snowflake,
  Sun,
  Wind,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CurrentWeather } from "@/types/weather";
import {
  formatDanishDate,
  formatDanishTime,
  formatMetric,
  getSourceLabel,
  getSourceShortLabel,
  getWeatherDescription,
} from "@/lib/weather";

interface WeatherHeroProps {
  current: CurrentWeather;
  generatedAt: string;
  summaryText: string;
  statusText: string;
}

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

function SourceDetails({
  title,
  source,
  dmiValue,
  mlValue,
  suffix,
}: {
  title: string;
  source: CurrentWeather["tempSource"];
  dmiValue: number | null;
  mlValue: number | null;
  suffix: string;
}) {
  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-dashboard-text-muted">{title}</p>
        <Badge 
          variant={source === "ml" ? "default" : "secondary"}
          className={source === "ml" ? "bg-dashboard-ml hover:bg-dashboard-ml" : "bg-dashboard-border"}
        >
          {getSourceLabel(source)}
        </Badge>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p className="flex justify-between">
          <span className="text-dashboard-text-muted">ML:</span>
          <span className="font-medium text-dashboard-ml">{formatMetric(mlValue, suffix)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-dashboard-text-muted">DMI:</span>
          <span className="font-medium text-dashboard-dmi">{formatMetric(dmiValue, suffix)}</span>
        </p>
      </div>
    </div>
  );
}

export function WeatherHero({ current, generatedAt, summaryText, statusText }: WeatherHeroProps) {
  const temperature = current.temp === null ? "—" : `${Math.round(current.temp)}`;
  const apparent = current.apparentTemp === null ? null : `${Math.round(current.apparentTemp)}°C`;
  const rain = `${current.rainProb.toFixed(0)}%`;
  const wind = current.windSpeed === null ? "—" : `${current.windSpeed.toFixed(1)} m/s`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-dashboard-border bg-gradient-to-br from-[#2d3342] via-[#252a36] to-[#1e222d]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.08),transparent_40%)]" />
      <div className="relative px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-b from-[#3d4659] to-[#2b303d] border border-dashboard-border shadow-lg md:h-28 md:w-28">
              {getWeatherIcon(current.weatherCode, "h-12 w-12 text-yellow-400")}
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-dashboard-text-muted">Aarhus</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-semibold tracking-tighter text-dashboard-text md:text-7xl">{temperature}</span>
                  <span className="text-2xl text-dashboard-text-muted">°C</span>
                </div>
                <Badge 
                  variant={current.tempSource === "ml" ? "default" : "secondary"}
                  className={current.tempSource === "ml" ? "bg-dashboard-ml hover:bg-dashboard-ml" : "bg-dashboard-border"}
                >
                  {getSourceShortLabel(current.tempSource)}
                </Badge>
              </div>
              <p className="mt-2 text-lg text-dashboard-text">
                {getWeatherDescription(current.weatherCode)}
              </p>
              {apparent && (
                <p className="text-sm text-dashboard-text-muted">Føles som {apparent}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 text-left md:text-right">
            <p className="text-sm text-dashboard-text-muted">{formatDanishDate(generatedAt)}</p>
            <p className="text-sm font-medium text-dashboard-text">
              Opdateret {formatDanishTime(generatedAt)}
            </p>
            <p className="max-w-md text-sm text-dashboard-text-muted">{statusText}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_1.3fr]">
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4">
            <div className="flex items-center gap-2 text-sm text-dashboard-text-muted">
              <Wind className="h-4 w-4" />
              Vind
            </div>
            <p className="mt-2 text-2xl font-semibold text-dashboard-text">{wind}</p>
            <Badge 
              variant={current.windSpeedSource === "ml" ? "default" : "secondary"}
              className={`mt-3 ${current.windSpeedSource === "ml" ? "bg-dashboard-ml hover:bg-dashboard-ml" : "bg-dashboard-border"}`}
            >
              {getSourceLabel(current.windSpeedSource)}
            </Badge>
          </div>
          <div className="rounded-xl border border-dashboard-border bg-dashboard-card p-4">
            <div className="flex items-center gap-2 text-sm text-dashboard-text-muted">
              <Droplets className="h-4 w-4" />
              Regnrisiko
            </div>
            <p className="mt-2 text-2xl font-semibold text-dashboard-text">{rain}</p>
            <Badge 
              variant={current.rainProbSource === "ml" ? "default" : "secondary"}
              className={`mt-3 ${current.rainProbSource === "ml" ? "bg-dashboard-ml hover:bg-dashboard-ml" : "bg-dashboard-border"}`}
            >
              {getSourceLabel(current.rainProbSource)}
            </Badge>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-dashboard-ml/20 to-dashboard-dmi/20 p-4 border border-dashboard-ml/30">
            <p className="text-sm uppercase tracking-wide text-dashboard-text-muted">Hvad betyder det?</p>
            <p className="mt-2 text-base font-medium text-dashboard-text">{summaryText}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SourceDetails
            title="Temperaturkilde"
            source={current.tempSource}
            dmiValue={current.dmiTemp}
            mlValue={current.mlTemp}
            suffix="°C"
          />
          <SourceDetails
            title="Vindkilde"
            source={current.windSpeedSource}
            dmiValue={current.dmiWindSpeed}
            mlValue={current.mlWindSpeed}
            suffix=" m/s"
          />
          <SourceDetails
            title="Regnkilde"
            source={current.rainProbSource}
            dmiValue={current.dmiRainProb}
            mlValue={current.mlRainProb}
            suffix="%"
          />
        </div>
      </div>
    </motion.section>
  );
}
