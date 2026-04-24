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
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CurrentWeather } from "@/types/weather";
import {
  formatDanishDate,
  formatDanishTime,
  formatMetric,
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

function getWeatherGradient(code: number | null): string {
  if (code === null) return "from-slate-500/20 to-slate-600/10";
  if (code === 0 || code === 1) return "from-amber-500/20 to-orange-500/10";
  if (code === 2) return "from-yellow-400/20 to-amber-500/10";
  if (code === 3) return "from-slate-400/20 to-slate-500/10";
  if (code >= 45 && code <= 48) return "from-gray-400/20 to-slate-500/10";
  if (code >= 51 && code <= 82) return "from-cyan-500/20 to-blue-500/10";
  if (code >= 71 && code <= 77) return "from-sky-300/20 to-blue-400/10";
  if (code >= 95) return "from-violet-500/20 to-purple-500/10";
  return "from-slate-500/20 to-slate-600/10";
}

function SourcePill({
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
  const isMl = source === "ml";
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider">
          {title}
        </span>
        <Badge
          variant="outline"
          className={`text-[10px] h-5 px-1.5 ${
            isMl
              ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
              : "border-coral/30 text-coral bg-coral/10"
          }`}
        >
          {getSourceShortLabel(source)}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-aether-text-secondary">ML</span>
          <span className="font-semibold text-cyan-400">{formatMetric(mlValue, suffix)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-aether-text-secondary">DMI</span>
          <span className="font-semibold text-coral">{formatMetric(dmiValue, suffix)}</span>
        </div>
      </div>
    </div>
  );
}

export function WeatherHero({ current, generatedAt }: WeatherHeroProps) {
  const temperature = current.temp === null ? "—" : `${Math.round(current.temp)}`;
  const apparent = current.apparentTemp === null ? null : `${Math.round(current.apparentTemp)}°C`;
  const rain = `${current.rainProb.toFixed(0)}%`;
  const wind = current.windSpeed === null ? "—" : `${current.windSpeed.toFixed(1)}`;
  const weatherGradient = getWeatherGradient(current.weatherCode);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.01]"
    >
      {/* Dynamic weather glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${weatherGradient} opacity-60`} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-500/[0.03] rounded-full blur-[80px]" />

      <div className="relative p-6 md:p-10">
        {/* Top row: Location and update time */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <Cloud className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-[0.2em]">Aarhus, Danmark</p>
              <p className="text-sm text-aether-text-secondary">{formatDanishDate(generatedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-aether-text-tertiary">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Opdateret {formatDanishTime(generatedAt)}
          </div>
        </div>

        {/* Main weather display */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Left: Big temperature */}
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] shadow-2xl"
            >
              <div className="absolute inset-0 rounded-3xl bg-cyan-500/5 blur-xl" />
              {getWeatherIcon(current.weatherCode, "h-12 w-12 md:h-16 md:w-16 text-amber-400 relative z-10")}
            </motion.div>
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-7xl md:text-8xl font-bold tracking-tighter text-white">{temperature}</span>
                <span className="text-3xl md:text-4xl font-light text-aether-text-secondary">°C</span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-lg text-aether-text-secondary">{getWeatherDescription(current.weatherCode)}</p>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    current.tempSource === "ml"
                      ? "border-cyan-500/30 text-cyan-400 bg-cyan-400/10"
                      : "border-coral/30 text-coral bg-coral/10"
                  }`}
                >
                  {getSourceShortLabel(current.tempSource)}
                </Badge>
              </div>
              {apparent && (
                <p className="mt-1 text-sm text-aether-text-tertiary">Føles som {apparent}</p>
              )}
            </div>
          </div>

          {/* Right: Quick stats */}
          <div className="flex gap-3">
            <div className="glass-card px-5 py-4 min-w-[120px]">
              <div className="flex items-center gap-2 text-aether-text-tertiary mb-2">
                <Wind className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Vind</span>
              </div>
              <p className="text-2xl font-bold text-white">{wind} <span className="text-sm font-normal text-aether-text-secondary">m/s</span></p>
              <div className="mt-1.5 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-aether-text-tertiary" />
                <span className="text-xs text-aether-text-tertiary">{current.windGust !== null ? `${current.windGust.toFixed(0)} m/s stød` : "—"}</span>
              </div>
            </div>
            <div className="glass-card px-5 py-4 min-w-[120px]">
              <div className="flex items-center gap-2 text-aether-text-tertiary mb-2">
                <Droplets className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Regn</span>
              </div>
              <p className="text-2xl font-bold text-white">{rain}</p>
              <div className="mt-1.5 flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3 text-aether-text-tertiary" />
                <span className="text-xs text-aether-text-tertiary">{current.rainAmount.toFixed(1)} mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Source comparison row */}
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <SourcePill
            title="Temperatur"
            source={current.tempSource}
            dmiValue={current.dmiTemp}
            mlValue={current.mlTemp}
            suffix="°C"
          />
          <SourcePill
            title="Vind"
            source={current.windSpeedSource}
            dmiValue={current.dmiWindSpeed}
            mlValue={current.mlWindSpeed}
            suffix=" m/s"
          />
          <SourcePill
            title="Regnrisiko"
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
