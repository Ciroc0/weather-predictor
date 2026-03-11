import { Suspense, lazy } from "react";

import { FaqSection } from "@/components/FaqSection";
import { PageIntro } from "@/components/PageIntro";
import { PageState } from "@/components/PageState";
import { SeoHead } from "@/components/SeoHead";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { windSeo } from "@/lib/seo";

const WindTab = lazy(() =>
  import("@/components/weather/WindTab").then((module) => ({ default: module.WindTab })),
);

export function WindPage() {
  const { response } = useDashboardOutlet();

  return (
    <div className="space-y-6">
      <SeoHead config={windSeo} />
      <PageIntro
        breadcrumbs={windSeo.breadcrumbs}
        title="Vind og vindstød i Aarhus"
        paragraphs={[
          "Vindforholdene i Aarhus kan skifte hurtigt mellem kyst, havn og by. Derfor giver det mening at sammenligne den rå DMI-prognose med en lokal ML-model for vind og vindstød.",
          "På denne side kan du både se den kommende vindprognose og en historisk backtest, så du får et mere realistisk billede af, hvor præcist modellerne har ramt Aarhus.",
        ]}
        relatedLinks={[
          {
            to: "/regn",
            label: "Se regn i Aarhus",
            description: "Fortsæt til regnrisiko, regnmængde og mulige tørre perioder for de næste timer.",
          },
          {
            to: "/performance",
            label: "Se modelperformance",
            description: "Undersøg fejlmål og historisk præcision for temperatur, vind og regn.",
          },
        ]}
      />

      <Suspense
        fallback={
          <PageState
            mode="loading"
            title="Indlæser vindgrafer"
            description="Vindhastighed, vindstød og retning for Aarhus klargøres."
          />
        }
      >
        <WindTab
          forecast={response.snapshot.forecast}
          history={response.snapshot.history.wind}
          alerts={response.snapshot.alerts}
          windStatus={response.snapshot.targetStatus.wind_speed}
          gustStatus={response.snapshot.targetStatus.wind_gust}
          explanations={response.snapshot.explanations}
        />
      </Suspense>

      <FaqSection items={windSeo.faqItems ?? []} />
    </div>
  );
}
