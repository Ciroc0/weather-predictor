import { Cloud, Droplets, Thermometer, Wind } from "lucide-react";
import type { CurrentWeather } from "@/types/weather";
import { formatDanishDate, formatDanishTime, getWeatherDescription } from "@/lib/weather";

interface WeatherHeroProps { current: CurrentWeather; generatedAt: string; summaryText: string; statusText: string; }

function value(value: number | null, suffix: string, digits = 0) {
  return value === null ? "–" : `${value.toFixed(digits)}${suffix}`;
}

export function WeatherHero({ current, generatedAt, statusText }: WeatherHeroProps) {
  const description = getWeatherDescription(current.weatherCode);
  return (
    <section className="weather-hero">
      <div className="hero-location">
        <h1>Aarhus</h1>
        <p>{formatDanishDate(generatedAt)}</p>
      </div>

      <div className="current-weather">
        <Cloud className="hero-weather-icon" strokeWidth={1.35} aria-hidden="true" />
        <div>
          <div className="temperature-reading"><strong>{current.temp === null ? "–" : Math.round(current.temp)}</strong><span>°C</span></div>
          <h2>{description}</h2>
          <p>Føles som {value(current.apparentTemp, " °C")}</p>
        </div>
      </div>

      <div className="current-details">
        <div><Wind aria-hidden="true" /><span><small>Vind</small><strong>{value(current.windSpeed, " m/s", 1)}</strong><em>Stød {value(current.windGust, " m/s", 1)}</em></span></div>
        <div><Droplets aria-hidden="true" /><span><small>Regn</small><strong>{current.rainProb.toFixed(0)}%</strong><em>{current.rainAmount.toFixed(1)} mm forventet</em></span></div>
        <div><Thermometer aria-hidden="true" /><span><small>Luftfugtighed</small><strong>{value(current.humidity, "%")}</strong><em>{value(current.pressure, " hPa")}</em></span></div>
      </div>

      <div className="hero-story">
        <div>
          <h2>Kort fortalt</h2>
          <p>{description} i Aarhus. Vind op til {value(current.windGust, " m/s", 1)} og {current.rainProb.toFixed(0)}% risiko for regn lige nu.</p>
        </div>
        <div className="model-explainer">
          <h2>DMI vs. lokal ML <span>(næste 24 timer)</span></h2>
          <div className="model-legend">
            <div><i className="dmi-line" /><span><strong>DMI (baseline)</strong><small>Officiel prognose fra DMI.</small></span></div>
            <div><i className="ml-line" /><span><strong>Lokal ML (justeret)</strong><small>Justeret for lokale forhold i Aarhus.</small></span></div>
          </div>
          <p className="model-note">{statusText} Opdateret kl. {formatDanishTime(generatedAt)}.</p>
        </div>
      </div>
    </section>
  );
}
