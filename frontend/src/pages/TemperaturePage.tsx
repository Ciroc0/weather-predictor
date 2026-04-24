import { Suspense, lazy } from "react";

import { FaqSection } from "@/components/FaqSection";
import { PageState } from "@/components/PageState";
import { SeoHead } from "@/components/SeoHead";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { temperatureSeo } from "@/lib/seo";

const TemperatureTab = lazy(() =>
  import("@/components/weather/TemperatureTab").then((module) => ({ default: module.TemperatureTab })),
);

export function TemperaturePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;

  const dmiTemp = snapshot.current.dmiTemp;
  const mlTemp = snapshot.current.mlTemp;
  const deviation = mlTemp !== null && dmiTemp !== null ? mlTemp - dmiTemp : null;

  return (
    <div className="space-y-6">
      <SeoHead config={temperatureSeo} />

      {/* Header */}
      <section className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
              Temperatur i <span className="text-gradient-cyan">Aarhus</span>
            </h1>
            <p className="text-sm text-aether-text-secondary max-w-2xl leading-relaxed">
              Følg temperaturprognosen og se forskellen mellem DMI's prognoser og vores 
              ML-justerede bud. Grafen viser både historisk data og prognoser.
            </p>
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-6 border-l-2 border-l-cyan-400">
          <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">ML Temperatur</p>
          <p className="text-4xl font-bold text-cyan-400">
            {mlTemp !== null ? `${Math.round(mlTemp)}°C` : "—"}
          </p>
          <p className="text-xs text-aether-text-secondary mt-1">Maskinlæringsprognose</p>
        </div>
        <div className="glass-card p-6 border-l-2 border-l-coral">
          <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">DMI Temperatur</p>
          <p className="text-4xl font-bold text-coral">
            {dmiTemp !== null ? `${Math.round(dmiTemp)}°C` : "—"}
          </p>
          <p className="text-xs text-aether-text-secondary mt-1">DMI's officielle prognose</p>
        </div>
        <div className="glass-card p-6 border-l-2 border-l-violet-400">
          <p className="text-xs font-medium text-aether-text-tertiary uppercase tracking-wider mb-2">Afvigelse</p>
          <p className="text-4xl font-bold text-violet-400">
            {deviation !== null ? `${deviation > 0 ? '+' : ''}${deviation.toFixed(0)}°C` : "—"}
          </p>
          <p className="text-xs text-aether-text-secondary mt-1">Forskel ML vs DMI</p>
        </div>
      </div>

      <Suspense
        fallback={
          <PageState
            mode="loading"
            title="Indlæser temperaturgrafer"
            description="Temperaturhistorik og forecast for Aarhus gøres klar."
          />
        }
      >
        <TemperatureTab
          forecast={response.snapshot.forecast}
          history={response.snapshot.history.temperature}
          verification={response.snapshot.verification}
          targetStatus={response.snapshot.targetStatus.temperature}
          explanations={response.snapshot.explanations}
        />
      </Suspense>

      <FaqSection items={temperatureSeo.faqItems ?? []} />
    </div>
  );
}
