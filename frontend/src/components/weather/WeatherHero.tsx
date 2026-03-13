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

import type { CurrentWeather } from "@/types/weather";
import {
  formatDanishDate,
  formatDanishTime,
  formatMetric,
  getSourceLabel,
  getWeatherDescription,
} from "@/lib/weather";
import { DetailPill, MetricCard, SourceBadge } from "@/components/weather/WeatherDisplay";

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
    <div className="soft-surface h-full p-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
        <SourceBadge source={source} />
      </div>
      <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">ML:</span> {formatMetric(mlValue, suffix)}
        </p>
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">DMI:</span> {formatMetric(dmiValue, suffix)}
        </p>
      </div>
    </div>
  );
}

export function WeatherHero({ current, generatedAt, summaryText, statusText }: WeatherHeroProps) {
  const temperature = current.temp === null ? "—" : `${Math.round(current.temp)}°`;
  const apparent = current.apparentTemp === null ? null : `${Math.round(current.apparentTemp)}°C`;
  const rain = `${current.rainProb.toFixed(0)}%`;
  const wind = current.windSpeed === null ? "—" : `${current.windSpeed.toFixed(1)} m/s`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="panel-card relative overflow-hidden rounded-[2rem] border-slate-200/80 bg-gradient-to-br from-sky-100 via-white to-emerald-50 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_40%)]" />
      <div className="relative space-y-6 px-5 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] xl:items-start">
          <div className="min-w-0 rounded-[1.6rem] border border-white/70 bg-white/78 p-5 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/72 sm:p-6">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.75rem] bg-white/90 shadow-lg ring-1 ring-white/80 dark:bg-slate-800/80 dark:ring-slate-700/70">
                {getWeatherIcon(current.weatherCode, "h-12 w-12 text-slate-700 dark:text-slate-100")}
              </div>
              <div className="min-w-0 space-y-3">
                <p className="section-eyebrow">Lige nu i Aarhus</p>
                <div className="flex min-w-0 flex-wrap items-end gap-3">
                  <span className="text-5xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-6xl">
                    {temperature}
                  </span>
                  <SourceBadge source={current.tempSource} />
                </div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                  {getWeatherDescription(current.weatherCode)}
                </p>
                {apparent ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Foeles som {apparent}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="soft-surface h-full p-5 sm:p-6">
            <p className="section-eyebrow">Det vigtigste foerst</p>
            <div className="mt-4 space-y-4">
              <p className="text-base font-semibold leading-7 text-slate-900 dark:text-slate-50">{summaryText}</p>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{statusText}</p>
              <div className="flex flex-wrap gap-2">
                <DetailPill label="Dato" value={formatDanishDate(generatedAt)} />
                <DetailPill label="Opdateret" value={formatDanishTime(generatedAt)} />
                <DetailPill label="Kilde" value={getSourceLabel(current.tempSource)} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={<Wind className="h-4 w-4" />}
            label="Vind lige nu"
            value={wind}
            detail="Viser den aktive værdi lige nu. DMI og ML sammenlignes længere nede."
            badge={<SourceBadge source={current.windSpeedSource} />}
          />
          <MetricCard
            icon={<Droplets className="h-4 w-4" />}
            label="Regnrisiko lige nu"
            value={rain}
            detail="Et hurtigt svar paa sandsynligheden for regn i den aktuelle time."
            badge={<SourceBadge source={current.rainProbSource} />}
          />
          <MetricCard
            icon={<CloudRain className="h-4 w-4" />}
            label="Foeles som"
            value={apparent ?? "Ingen data"}
            detail="Brug denne sammen med temperatur og vind, hvis du vil vurdere komfort frem for ren temperatur."
            badge={<SourceBadge source={current.tempSource} />}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
