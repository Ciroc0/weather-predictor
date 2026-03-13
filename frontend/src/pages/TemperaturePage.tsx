import { Suspense, lazy } from "react";

import { FaqSection } from "@/components/FaqSection";
import { PageIntro } from "@/components/PageIntro";
import { PageState } from "@/components/PageState";
import { SeoHead } from "@/components/SeoHead";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { temperatureSeo } from "@/lib/seo";

const TemperatureTab = lazy(() =>
  import("@/components/weather/TemperatureTab").then((module) => ({ default: module.TemperatureTab })),
);

export function TemperaturePage() {
  const { response } = useDashboardOutlet();

  return (
    <div className="page-stack">
      <SeoHead config={temperatureSeo} />
      <PageIntro
        breadcrumbs={temperatureSeo.breadcrumbs}
        title="Temperaturprognose for Aarhus"
        paragraphs={[
          "Her kan du følge temperaturprognosen for Aarhus og se forskellen mellem DMI's rå prognose og vores ML-justerede bud på de næste timer.",
          "Siden viser både backtest og forecast, så du kan vurdere om modellen har ramt tættere på de målte temperaturer i Aarhus end DMI gjorde i samme periode.",
        ]}
        relatedLinks={[
          {
            to: "/vind",
            label: "Se vind i Aarhus",
            description: "Gå videre til vind, vindstød og vindretning med samme DMI vs ML-sammenligning.",
          },
          {
            to: "/performance",
            label: "Se modelperformance",
            description: "Få mere kontekst om RMSE, MAE og hvor ofte ML faktisk slår DMI i Aarhus.",
          },
        ]}
      />

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
