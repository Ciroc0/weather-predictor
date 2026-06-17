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

      <section className="glass-card p-6 md:p-8">
        <p className="metric-label">Temperatur</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Temperatur i Aarhus
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa3ad]">
          DMI og ML sammenlignes time for time. Historikken viser forecast mod faktisk maalt temperatur.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-6">
          <p className="metric-label mb-2">ML temperatur</p>
          <p className="metric-value text-[#11c5d6]">{mlTemp !== null ? `${Math.round(mlTemp)} C` : "--"}</p>
          <p className="mt-1 text-xs text-[#9aa3ad]">Maskinlaeringsprognose</p>
        </div>
        <div className="glass-card p-6">
          <p className="metric-label mb-2">DMI temperatur</p>
          <p className="metric-value">{dmiTemp !== null ? `${Math.round(dmiTemp)} C` : "--"}</p>
          <p className="mt-1 text-xs text-[#9aa3ad]">Officiel baseline</p>
        </div>
        <div className="glass-card p-6">
          <p className="metric-label mb-2">Afvigelse</p>
          <p className="metric-value">
            {deviation !== null ? `${deviation > 0 ? "+" : ""}${deviation.toFixed(0)} C` : "--"}
          </p>
          <p className="mt-1 text-xs text-[#9aa3ad]">Forskel ML vs DMI</p>
        </div>
      </div>

      <Suspense
        fallback={
          <PageState
            mode="loading"
            title="Indlaeser temperaturgrafer"
            description="Temperaturhistorik og forecast for Aarhus goeres klar."
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
