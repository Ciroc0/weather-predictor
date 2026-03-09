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
import { formatDanishDate, formatDanishTime, getWeatherDescription } from "@/lib/weather";

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

export function WeatherHero({ current, generatedAt, summaryText, statusText }: WeatherHeroProps) {
  const temperature = current.temp === null ? "—" : `${Math.round(current.temp)}`;
  const apparent = current.apparentTemp === null ? "—" : `${Math.round(current.apparentTemp)}°C`;
  const rain = `${current.rainProb.toFixed(0)}%`;
  const wind = current.windSpeed === null ? "—" : `${current.windSpeed.toFixed(1)} m/s`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-sky-100 via-white to-emerald-50 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_40%)]" />
      <div className="relative px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/80 shadow-lg ring-1 ring-white/80 dark:bg-slate-800/70 dark:ring-slate-700/70 md:h-28 md:w-28">
              {getWeatherIcon(current.weatherCode, "h-12 w-12 text-slate-700 dark:text-slate-100")}
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Aarhus</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-6xl font-semibold tracking-tighter md:text-7xl">{temperature}</span>
                <span className="text-2xl text-slate-500 dark:text-slate-400">°C</span>
              </div>
              <p className="mt-2 text-lg text-slate-700 dark:text-slate-300">
                {getWeatherDescription(current.weatherCode)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Føles som {apparent}</p>
            </div>
          </div>

          <div className="space-y-2 text-left md:text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatDanishDate(generatedAt)}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Opdateret {formatDanishTime(generatedAt)}</p>
            <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">{statusText}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_1.3fr]">
          <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Wind className="h-4 w-4" />
              Vind
            </div>
            <p className="mt-2 text-2xl font-semibold">{wind}</p>
          </div>
          <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Droplets className="h-4 w-4" />
              Regnrisiko
            </div>
            <p className="mt-2 text-2xl font-semibold">{rain}</p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-4 text-slate-50 ring-1 ring-slate-950 dark:bg-white dark:text-slate-950 dark:ring-slate-100">
            <p className="text-sm uppercase tracking-wide opacity-70">Modelstatus</p>
            <p className="mt-2 text-base font-medium">{summaryText}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
