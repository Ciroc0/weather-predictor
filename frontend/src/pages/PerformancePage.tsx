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

      <section className="glass-card p-6 md:p-8">
        <p className="metric-label">Performance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Model performance
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa3ad]">
          Verifikation, fejlrate, lead buckets og modelmetadata samlet for DMI baseline og ML-justering.
        </p>
      </section>

      <Suspense
        fallback={
          <PageState
            mode="loading"
            title="Indlaeser performancegrafer"
            description="Historik, fejlanalyse og modelstatus for Aarhus goeres klar."
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
