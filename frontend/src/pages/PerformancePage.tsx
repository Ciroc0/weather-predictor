import { Suspense, lazy } from "react";

import { FaqSection } from "@/components/FaqSection";
import { PageIntro } from "@/components/PageIntro";
import { PageState } from "@/components/PageState";
import { SeoHead } from "@/components/SeoHead";
import { useDashboardOutlet } from "@/hooks/useDashboardOutlet";
import { performanceSeo } from "@/lib/seo";

const PerformanceTab = lazy(() =>
  import("@/components/weather/PerformanceTab").then((module) => ({
    default: module.PerformanceTab,
  })),
);

export function PerformancePage() {
  const { response } = useDashboardOutlet();
  const snapshot = response.snapshot;

  return (
    <div className="page-stack">
      <SeoHead config={performanceSeo} />
      <PageIntro
        breadcrumbs={performanceSeo.breadcrumbs}
        title="Hvor præcis er ML i forhold til DMI?"
        paragraphs={[
          "Performance-siden viser, hvordan vores modeller har klaret sig mod det faktisk målte vejr i Aarhus. Her kan du se fejlmål som RMSE og MAE samt hvor ofte ML ligger tættere på virkeligheden end DMI.",
          "Tallene er historiske og skal læses som dokumentation for præcision, ikke som en garanti for at ML altid er bedst i næste forecast. Formålet er at gøre modelkvaliteten gennemsigtig.",
        ]}
        relatedLinks={[
          {
            to: "/temperatur",
            label: "Se temperaturprognosen",
            description: "Gå fra præcision til den konkrete temperaturgraf for Aarhus.",
          },
          {
            to: "/regn",
            label: "Se regnprognosen",
            description: "Følg regnrisiko og nedbør og se hvor modellerne adskiller sig mest.",
          },
        ]}
      />

      <Suspense
        fallback={
          <PageState
            mode="loading"
            title="Indlæser performancegrafer"
            description="Historik, fejlanalyse og modelstatus for Aarhus gøres klar."
          />
        }
      >
        <PerformanceTab
          verification={snapshot.verification}
          leadBuckets={snapshot.leadBuckets}
          featureImportance={snapshot.featureImportance}
          modelInfo={snapshot.modelInfo}
          history={snapshot.history}
          targetStatus={snapshot.targetStatus}
          targetLabels={snapshot.targetLabels}
          explanations={snapshot.explanations}
        />
      </Suspense>

      <FaqSection items={performanceSeo.faqItems ?? []} />
    </div>
  );
}
