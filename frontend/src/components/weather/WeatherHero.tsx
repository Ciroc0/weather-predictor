import { motion } from "framer-motion";
import { Cloud, Droplets, Gauge, Wind } from "lucide-react";

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

function SourceBlock({
  label,
  source,
  dmiValue,
  mlValue,
  suffix,
}: {
  label: string;
  source: CurrentWeather["tempSource"];
  dmiValue: number | null;
  mlValue: number | null;
  suffix: string;
}) {
  return (
    <div className="rounded-md border border-white/[0.08] bg-[#0c0e11] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="metric-label">{label}</p>
        <Badge variant="outline" className="border-[#11c5d6]/40 bg-transparent text-[10px] text-[#11c5d6]">
          {getSourceShortLabel(source)}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#68717b]">DMI</p>
          <p className="mt-1 font-semibold text-[#d8dde3]">{formatMetric(dmiValue, suffix)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#68717b]">ML</p>
          <p className="mt-1 font-semibold text-[#11c5d6]">{formatMetric(mlValue, suffix)}</p>
        </div>
      </div>
    </div>
  );
}

function MetaValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-cell">
      <p className="meta-k">{label}</p>
      <p className="meta-v">{value}</p>
    </div>
  );
}

export function WeatherHero({ current, generatedAt, summaryText, statusText }: WeatherHeroProps) {
  const temperature = current.temp === null ? "--" : `${Math.round(current.temp)}`;
  const apparent = current.apparentTemp === null ? "--" : `${Math.round(current.apparentTemp)} C`;
  const wind = current.windSpeed === null ? "--" : `${current.windSpeed.toFixed(1)} m/s`;
  const gust = current.windGust === null ? "--" : `${current.windGust.toFixed(1)} m/s`;
  const rain = `${current.rainProb.toFixed(0)}%`;
  const rainAmount = `${current.rainAmount.toFixed(1)} mm`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-lg border border-white/[0.1] bg-[#101216] p-5 md:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-[#11c5d6]/40 bg-transparent text-[#11c5d6]">
              Aarhus / {formatDanishDate(generatedAt)}
            </Badge>
            <span className="text-xs text-[#747d87]">Opdateret {formatDanishTime(generatedAt)}</span>
          </div>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="metric-label">Aktuel prognose</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-7xl font-semibold tracking-tight text-white md:text-8xl">{temperature}</span>
                <span className="text-2xl font-light text-[#9aa3ad]">C</span>
              </div>
              <p className="mt-2 text-sm text-[#9aa3ad]">
                {getWeatherDescription(current.weatherCode)} / foles som {apparent}
              </p>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-white/[0.08] bg-[#0c0e11] p-4">
                <div className="flex items-center gap-2 text-[#9aa3ad]">
                  <Wind className="h-4 w-4 text-[#11c5d6]" />
                  <p className="metric-label">Vind</p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">{wind}</p>
                <p className="mt-1 text-xs text-[#747d87]">Stod {gust}</p>
              </div>
              <div className="rounded-md border border-white/[0.08] bg-[#0c0e11] p-4">
                <div className="flex items-center gap-2 text-[#9aa3ad]">
                  <Droplets className="h-4 w-4 text-[#11c5d6]" />
                  <p className="metric-label">Regn</p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">{rain}</p>
                <p className="mt-1 text-xs text-[#747d87]">{rainAmount}</p>
              </div>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-[#8d96a0]">{summaryText}</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-white/[0.08] bg-[#0c0e11] p-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-[#11c5d6]" />
              <p className="metric-label">Snapshot status</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#d8dde3]">{statusText}</p>
          </div>
          <div className="meta-grid">
            <MetaValue label="Humidity" value={current.humidity === null ? "--" : `${current.humidity.toFixed(0)}%`} />
            <MetaValue label="Pressure" value={current.pressure === null ? "--" : `${current.pressure.toFixed(0)} hPa`} />
            <MetaValue label="Cloud cover" value={current.cloudCover === null ? "--" : `${current.cloudCover.toFixed(0)}%`} />
            <MetaValue label="Weather code" value={current.weatherCode === null ? "--" : String(current.weatherCode)} />
          </div>
          <div className="rounded-md border border-white/[0.08] bg-[#0c0e11] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#11c5d6]" />
              <p className="metric-label">DMI vs ML</p>
            </div>
            <div className="grid gap-3">
              <SourceBlock label="Temperatur" source={current.tempSource} dmiValue={current.dmiTemp} mlValue={current.mlTemp} suffix=" C" />
              <SourceBlock label="Vind" source={current.windSpeedSource} dmiValue={current.dmiWindSpeed} mlValue={current.mlWindSpeed} suffix=" m/s" />
              <SourceBlock label="Regnrisiko" source={current.rainProbSource} dmiValue={current.dmiRainProb} mlValue={current.mlRainProb} suffix="%" />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
