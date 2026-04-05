import { Suspense, lazy } from "react";

import { FaqSection } from "@/components/FaqSection";
import { PageState } from "@/components/PageState";
import { SeoHead } from "@/components/SeoHead";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { temperatureSeo } from "@/lib/seo";
import { Card, CardContent } from "@/components/ui/card";

const TemperatureTab = lazy(() =>
  import("@/components/weather/TemperatureTab").then((module) => ({ default: module.TemperatureTab })),
);

export function TemperaturePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;
  
  // Calculate deviation
  const dmiTemp = snapshot.current.dmiTemp;
  const mlTemp = snapshot.current.mlTemp;
  const deviation = mlTemp !== null && dmiTemp !== null ? mlTemp - dmiTemp : null;

  return (
    <div className="space-y-6">
      <SeoHead config={temperatureSeo} />
      
      {/* Header with Breadcrumb */}
      <section className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 text-dashboard-text">Temperatur Details and Forecast</h1>
        <p className="text-dashboard-text-muted max-w-3xl mx-auto text-sm leading-relaxed">
          Følg temperaturprognosen for Aarhus og se forskellen mellem DMI's prognoser og vores 
          ML-justerede bud. Grafen viser både historisk data og prognoser for de kommende timer.
        </p>
        <p className="text-dashboard-text-muted text-sm mt-2">
          <span className="underline cursor-pointer hover:text-dashboard-text">Forside</span>
          <span className="mx-2">&gt;</span>
          <span>Temperatur</span>
        </p>
      </section>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dashboard-card-flat">
          <CardContent className="p-6">
            <p className="text-sm text-dashboard-text-muted mb-1">Nuværende Temperatur</p>
            <p className="text-2xl font-bold text-dashboard-ml">
              ML: {mlTemp !== null ? `${Math.round(mlTemp)}°C` : "—"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card-flat">
          <CardContent className="p-6">
            <p className="text-sm text-dashboard-text-muted mb-1">Nuværende Temperatur</p>
            <p className="text-2xl font-bold text-dashboard-dmi">
              DMI: {dmiTemp !== null ? `${Math.round(dmiTemp)}°C` : "—"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card-flat">
          <CardContent className="p-6">
            <p className="text-sm text-dashboard-text-muted mb-1">ML vs DMI</p>
            <p className="text-2xl font-bold text-white">
              Afvigelse: {deviation !== null ? `${deviation > 0 ? '+' : ''}${deviation.toFixed(0)}°C` : "—"}
            </p>
          </CardContent>
        </Card>
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
