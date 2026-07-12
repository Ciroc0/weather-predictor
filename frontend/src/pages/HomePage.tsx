import { Cloud, CloudRain, Droplets, Gauge, Navigation2, Sun, Wind } from "lucide-react";
import { Link } from "react-router-dom";

import { SeoHead } from "@/components/SeoHead";
import { WeatherHero } from "@/components/weather/WeatherHero";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { homeSeo } from "@/lib/seo";
import { formatDanishTime, getForecastPreview, getTemperatureImprovementText } from "@/lib/weather";

function ForecastIcon({ code, cloudCover }: { code: number | null; cloudCover: number | null }) {
  if (code !== null && code >= 51) return <CloudRain aria-hidden="true" />;
  if ((cloudCover ?? 100) < 45) return <Sun aria-hidden="true" />;
  return <Cloud aria-hidden="true" />;
}

export function HomePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;
  const preview = getForecastPreview(snapshot.forecast, 13);

  return (
    <div>
      <SeoHead config={homeSeo} />
      <WeatherHero current={snapshot.current} generatedAt={snapshot.generatedAt} summaryText={snapshot.explanations.sources} statusText={response.stale ? "Viser seneste cachede data." : "Live data fra Hugging Face."} />

      <section className="hourly-section" aria-labelledby="hourly-title">
        <div className="section-heading-row">
          <div><p>Prognose</p><h2 id="hourly-title">Næste 24 timer</h2></div>
          <Link to="/temperatur">Se hele prognosen</Link>
        </div>
        <div className="hourly-scroll">
          {preview.map((hour) => (
            <article className="hourly-item" key={hour.timestamp}>
              <time>{formatDanishTime(hour.timestamp)}</time>
              <ForecastIcon code={hour.weatherCode} cloudCover={hour.cloudCover} />
              <strong>{hour.effectiveTemp === null ? "–" : `${Math.round(hour.effectiveTemp)}°`}</strong>
              <span><Droplets aria-hidden="true" />{hour.effectiveRainProb.toFixed(0)}%</span>
              <span><Navigation2 aria-hidden="true" />{hour.effectiveWindSpeed === null ? "–" : `${hour.effectiveWindSpeed.toFixed(0)} m/s`}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-insights">
        <div><Gauge aria-hidden="true" /><span><small>Modelperformance</small><strong>{getTemperatureImprovementText(snapshot.verification)}</strong></span><Link to="/performance">Se dokumentationen</Link></div>
        <div><Wind aria-hidden="true" /><span><small>Vind og skydække</small><strong>{snapshot.current.cloudCover === null ? "Ukendt skydække" : `${snapshot.current.cloudCover.toFixed(0)}% skydække`} · {snapshot.current.windDirection === null ? "Ukendt retning" : `${snapshot.current.windDirection.toFixed(0)}°`}</strong></span><Link to="/vind">Vinddetaljer</Link></div>
      </section>
    </div>
  );
}
