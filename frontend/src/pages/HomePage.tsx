import { Link } from "react-router-dom";
import { ArrowRight, CloudRain, Thermometer, Wind } from "lucide-react";

import { WeatherHero } from "@/components/weather/WeatherHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAlertSummary, getForecastPreview, getTemperatureImprovementText } from "@/lib/weather";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";

const quickLinks = [
  { href: "/temperatur", label: "Temperatur", icon: Thermometer },
  { href: "/vind", label: "Vind", icon: Wind },
  { href: "/regn", label: "Regn", icon: CloudRain },
];

export function HomePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;
  const preview = getForecastPreview(snapshot.forecast, 12);

  return (
    <div className="space-y-8">
      <WeatherHero
        current={snapshot.current}
        generatedAt={snapshot.generatedAt}
        summaryText={getTemperatureImprovementText(snapshot.verification)}
        statusText={response.stale ? "Viser seneste cachede snapshot." : "Live snapshot fra Hugging Face."}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} to={link.href}>
              <Card className="h-full border-slate-200 transition-transform hover:-translate-y-1 dark:border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg">{link.label}</CardTitle>
                  <Icon className="h-5 w-5 text-slate-500" />
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Se detaljeret forecast og DMI-vs-ML sammenligning.</span>
                  <ArrowRight className="h-4 w-4 flex-none" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Næste 12 timer</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {preview.map((hour) => (
              <div
                key={hour.timestamp}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{hour.hour}:00</p>
                <p className="mt-2 text-2xl font-semibold">{hour.mlTemp !== null ? `${Math.round(hour.mlTemp)}°` : "—"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  DMI {hour.dmiTemp !== null ? `${Math.round(hour.dmiTemp)}°` : "—"}
                </p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Vind {hour.mlWindSpeed !== null ? `${hour.mlWindSpeed.toFixed(1)} m/s` : "—"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Regn {hour.mlRainProb.toFixed(0)}%</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Aktive signaler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.alerts.length > 0 ? (
                snapshot.alerts.map((alert) => (
                  <div
                    key={`${alert.type}-${alert.title}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === "warning" ? "destructive" : "secondary"}>
                        {alert.severity === "warning" ? "Advarsel" : "Info"}
                      </Badge>
                      <p className="font-medium">{alert.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{alert.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">{getAlertSummary(snapshot)}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Modelstatus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>Trænet: {snapshot.modelInfo.trainedAt ? new Date(snapshot.modelInfo.trainedAt).toLocaleString("da-DK") : "Ukendt"}</p>
              <p>Samples: {snapshot.modelInfo.trainingSamples?.toLocaleString("da-DK") || "Ukendt"}</p>
              <p>Mål: {snapshot.modelInfo.targets.join(", ")}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
