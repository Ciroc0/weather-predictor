import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";

import { Navigation } from "@/components/Navigation";
import { PageState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DASHBOARD_QUERY_KEY } from "@/lib/api";
import { formatDanishDateTime } from "@/lib/weather";
import type { DashboardResponse } from "@/types/weather";

export interface DashboardOutletContext {
  response: DashboardResponse;
}

export function AppLayout() {
  const queryClient = useQueryClient();
  const dashboardQuery = useDashboardData();

  const response = useMemo(() => dashboardQuery.data, [dashboardQuery.data]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <Navigation
        lastUpdated={response?.snapshot.generatedAt ?? null}
        onRefresh={handleRefresh}
        isRefreshing={dashboardQuery.isFetching}
        isStale={response?.stale ?? false}
      />
      <main className="page-shell py-6 sm:py-8 lg:py-10">
        {dashboardQuery.isLoading && !response ? (
          <PageState mode="loading" />
        ) : dashboardQuery.isError && !response ? (
          <PageState
            mode="error"
            title="Kunne ikke hente vejrdata"
            description={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : "Kunne ikke hente data fra Hugging Face. Proev igen om lidt."
            }
            action={
              <Button onClick={handleRefresh} variant="outline">
                Proev igen
              </Button>
            }
          />
        ) : response ? (
          <Outlet context={{ response } satisfies DashboardOutletContext} />
        ) : (
          <PageState mode="empty" />
        )}
      </main>
      <footer className="border-t border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="page-shell grid gap-6 py-8 text-sm text-slate-600 dark:text-slate-400 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="min-w-0 space-y-4">
            <p className="copy-measure leading-6">
              <strong>Aarhus Vejr</strong> sammenligner DMI&apos;s vejrprognoser med vores ML-modeller.
              Se om kunstig intelligens kan forudsige vejret bedre end meteorologerne.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:text-slate-100"
                to="/"
              >
                Aarhus vejrudsigt
              </Link>
              <Link
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:text-slate-100"
                to="/temperatur"
              >
                Temperatur i Aarhus
              </Link>
              <Link
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:text-slate-100"
                to="/vind"
              >
                Vind i Aarhus
              </Link>
              <Link
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:text-slate-100"
                to="/regn"
              >
                Regn i Aarhus
              </Link>
              <Link
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:text-slate-100"
                to="/performance"
              >
                Modelperformance
              </Link>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="soft-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Snapshot
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                {response ? formatDanishDateTime(response.snapshot.generatedAt) : "Ingen snapshot indlaest"}
              </p>
            </div>
            <p className="leading-6">
              Vejrdata:{" "}
              <a
                className="hover:text-slate-900 hover:underline dark:hover:text-slate-100"
                href="https://open-meteo.com"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo
              </a>{" "}
              | Datakilde:{" "}
              <a
                className="hover:text-slate-900 hover:underline dark:hover:text-slate-100"
                href="https://www.dmi.dk"
                target="_blank"
                rel="noreferrer"
              >
                DMI
              </a>{" "}
              (CC BY 4.0)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
