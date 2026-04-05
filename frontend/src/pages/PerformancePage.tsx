import { Suspense, lazy } from "react";

import { FaqSection } from "@/components/FaqSection";
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
    <div className="space-y-6">
      <SeoHead config={performanceSeo} />

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
