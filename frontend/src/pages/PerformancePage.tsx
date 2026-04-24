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

      {/* Header */}
      <section className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
              Model <span className="text-gradient-cyan">Performance</span>
            </h1>
            <p className="text-sm text-aether-text-secondary max-w-2xl leading-relaxed">
              Sammenlign ML-modellernes præcision med DMI's prognoser og faktisk vejrdata. 
              Se hvordan modellen klarer sig på forskellige parametre og tidshorisonter.
            </p>
          </div>
        </div>
      </section>

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
