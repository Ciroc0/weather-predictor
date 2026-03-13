import { Suspense, lazy } from "react";

import { FaqSection } from "@/components/FaqSection";
import { PageIntro } from "@/components/PageIntro";
import { PageState } from "@/components/PageState";
import { SeoHead } from "@/components/SeoHead";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { rainSeo } from "@/lib/seo";

const RainTab = lazy(() =>
  import("@/components/weather/RainTab").then((module) => ({ default: module.RainTab })),
);

export function RainPage() {
  const { response } = useDashboardOutlet();

  return (
    <div className="space-y-6">
      <SeoHead config={rainSeo} />
      <PageIntro
        breadcrumbs={rainSeo.breadcrumbs}
        title="Regnrisiko og regnmængde i Aarhus"
        paragraphs={[
          "Regn i Aarhus handler både om sandsynlighed og mængde. Denne side samler begge dele, så du kan vurdere om der blot er risiko for byger, eller om der faktisk forventes mærkbar nedbør.",
          "Du kan også se mulige tørre perioder og sammenligne DMI med vores ML-model, som forsøger at justere signalet mere lokalt til Aarhus.",
        ]}
        relatedLinks={[
          {
            to: "/temperatur",
            label: "Se temperatur i Aarhus",
            description: "Sammenlign temperaturforecast og backtest for de næste og seneste timer.",
          },
          {
            to: "/vind",
            label: "Se vind i Aarhus",
            description: "Få overblik over vindstyrke, vindstød og vindretning i samme forecastunivers.",
          },
        ]}
      />

      <Suspense
        fallback={
          <PageState
            mode="loading"
            title="Indlæser regngrafer"
            description="Regnrisiko, regnmængde og tørre perioder for Aarhus gøres klar."
          />
        }
      >
        <RainTab
          forecast={response.snapshot.forecast}
          history={response.snapshot.history.rain}
          alerts={response.snapshot.alerts}
          rainEventStatus={response.snapshot.targetStatus.rain_event}
          rainAmountStatus={response.snapshot.targetStatus.rain_amount}
          explanations={response.snapshot.explanations}
        />
      </Suspense>

      <FaqSection items={rainSeo.faqItems ?? []} />
    </div>
  );
}
