import { Link } from "react-router-dom";
import { ArrowRight, CloudRain, Thermometer, Wind } from "lucide-react";

import { PageIntro } from "@/components/PageIntro";
import { SeoHead } from "@/components/SeoHead";
import { WeatherHero } from "@/components/weather/WeatherHero";
import { DetailPill, MetricCard, SectionBanner, SourceBadge } from "@/components/weather/WeatherDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { homeSeo } from "@/lib/seo";
import {
  formatDanishDate,
  formatDanishTime,
  getAlertSummary,
  getForecastPreview,
  getTargetStatusSummary,
  getTemperatureImprovementText,
} from "@/lib/weather";

const quickLinks = [
  {
    href: "/temperatur",
    label: "Temperatur",
    icon: Thermometer,
    description: "Se temperaturprognosen for Aarhus og sammenlign DMI med ML i forecast og historik.",
  },
  {
    href: "/vind",
    label: "Vind",
    icon: Wind,
    description: "Faa overblik over vindhastighed, vindstoed og vindretning med lokale justeringer.",
  },
  {
    href: "/regn",
    label: "Regn",
    icon: CloudRain,
    description: "Foelg regnrisiko, regnmaengde og mulige toerre perioder side om side.",
  },
];

export function HomePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;
  const preview = getForecastPreview(snapshot.forecast, 12);
  const statusSummary = getTargetStatusSummary(snapshot.targetStatus, snapshot.targetLabels);

  return (
    <div className="page-stack">
      <SeoHead config={homeSeo} />

      <PageIntro
        title="Aarhus Vejr: sammenlign ML og DMI for Aarhus"
        paragraphs={[
          "Aarhus Vejr samler temperatur, vind, regn og modelperformance paa et sted, saa du hurtigt kan se forskellen mellem DMI's prognose og vores lokale ML-justeringer.",
          "Siden er lavet til almindelige brugere foerst: de vigtigste svar staar oeverst, mens grafer og historik stadig er tilgængelige, hvis du vil gaa i dybden.",
        ]}
        relatedLinks={[
          {
            to: "/temperatur",
            label: "Temperatur i Aarhus",
            description: "Se temperaturgrafen, backtest og hvornar ML ligger over eller under DMI.",
          },
          {
            to: "/vind",
            label: "Vind og vindstoed i Aarhus",
            description: "Undersoeg vindretning, vindstyrke og lokale udsving i Aarhus.",
          },
          {
            to: "/performance",
            label: "Modelperformance",
            description: "Foelg RMSE, MAE og win rate for at se om ML faktisk rammer bedre end DMI.",
          },
        ]}
      />

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

      <section className="section-stack">
        <SectionBanner
          eyebrow="Hurtigt overblik"
          title="Det vigtigste at se paa lige nu"
          description="Brug de tre hovedveje herunder, hvis du bare vil vide hvordan temperaturen, vinden eller regnen ser ud de naeste timer."
          badge={<DetailPill label="Snapshot" value={formatDanishDate(snapshot.generatedAt)} />}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} to={link.href} className="group min-w-0">
                <Card className="panel-card h-full border-slate-200/80 py-0 transition-transform duration-200 group-hover:-translate-y-1 dark:border-slate-800">
                  <CardHeader className="gap-3 pb-0">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="section-eyebrow">Gå til side</p>
                        <CardTitle className="text-xl">{link.label}</CardTitle>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex h-full min-w-0 flex-col justify-between gap-4 p-6">
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{link.description}</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      Se side
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <Card className="panel-card py-0">
          <CardHeader className="gap-4 border-b border-slate-200/70 pb-5 dark:border-slate-800/80">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="section-eyebrow">Naeste timer</p>
                <CardTitle className="text-xl">Naeste 12 timer i Aarhus</CardTitle>
                <p className="copy-measure text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Her ser du den valgte temperatur for hver time, sammen med vind og regnrisiko.
                </p>
              </div>
              <DetailPill label="Temperatur" value={getTemperatureImprovementText(snapshot.verification)} />
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] sm:overflow-visible sm:px-0">
              {preview.map((hour) => (
                <div
                  key={hour.timestamp}
                  className="soft-surface min-w-[10.75rem] snap-start p-4 sm:min-w-0"
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      kl. {formatDanishTime(hour.timestamp)}
                    </p>
                    <SourceBadge source={hour.effectiveTempSource} />
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                    {hour.effectiveTemp !== null ? `${Math.round(hour.effectiveTemp)}°` : "—"}
                  </p>
                  <div className="mt-4 space-y-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    <p>ML {hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "ikke aktiv"}</p>
                    <p>DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "ingen data"}</p>
                    <p>Vind {hour.effectiveWindSpeed !== null ? `${hour.effectiveWindSpeed.toFixed(1)} m/s` : "—"}</p>
                    <p>Regn {hour.effectiveRainProb.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <MetricCard
            label="Varsler og forhold"
            value={snapshot.alerts.length > 0 ? "Hold oje" : "Ingen varsler"}
            detail={snapshot.alerts.length > 0 ? snapshot.alerts[0].message : getAlertSummary(snapshot)}
            emphasis={snapshot.alerts.length > 0 ? "warning" : "default"}
          />
          <MetricCard
            label="Modelstatus"
            value="Aktive signaler"
            detail={snapshot.explanations.forecast}
            secondaryDetail={statusSummary.join(" • ")}
            badge={<SourceBadge source="ml" />}
          />
          <MetricCard
            label="Om prognoserne"
            value={snapshot.modelInfo.trainedAt ? formatDanishDate(snapshot.modelInfo.trainedAt) : "Under udvikling"}
            detail={
              snapshot.modelInfo.trainingSamples
                ? `${snapshot.modelInfo.trainingSamples.toLocaleString("da-DK")} observationer brugt til traening.`
                : "Traeningsomfang er ikke tilgaengeligt endnu."
            }
            secondaryDetail={snapshot.explanations.performance}
          />
        </div>
      </section>
    </div>
  );
}
