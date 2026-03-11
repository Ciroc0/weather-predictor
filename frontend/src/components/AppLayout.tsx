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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {dashboardQuery.isLoading && !response ? (
          <PageState mode="loading" />
        ) : dashboardQuery.isError && !response ? (
          <PageState
            mode="error"
            title="Kunne ikke hente vejrdata"
            description={
              dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : "Kunne ikke hente data fra Hugging Face. Prøv igen om lidt."
            }
            action={
              <Button onClick={handleRefresh} variant="outline">
                Prøv igen
              </Button>
            }
          />
        ) : response ? (
          <Outlet context={{ response } satisfies DashboardOutletContext} />
        ) : (
          <PageState mode="empty" />
        )}
      </main>
      <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-slate-600 dark:text-slate-400 sm:px-6 lg:px-8">
          <p>
            <strong>Aarhus Vejr</strong> sammenligner DMI&apos;s vejrprognoser med vores ML-modeller.
            Se om kunstig intelligens kan forudsige vejret bedre end meteorologerne.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="hover:text-slate-900 dark:hover:text-slate-100" to="/">
              Aarhus vejrudsigt
            </Link>
            <Link className="hover:text-slate-900 dark:hover:text-slate-100" to="/temperatur">
              Temperatur i Aarhus
            </Link>
            <Link className="hover:text-slate-900 dark:hover:text-slate-100" to="/vind">
              Vind i Aarhus
            </Link>
            <Link className="hover:text-slate-900 dark:hover:text-slate-100" to="/regn">
              Regn i Aarhus
            </Link>
            <Link className="hover:text-slate-900 dark:hover:text-slate-100" to="/performance">
              Modelperformance
            </Link>
          </div>
          <p>
            {response
              ? `Snapshot: ${formatDanishDateTime(response.snapshot.generatedAt)}`
              : "Ingen snapshot indlæst"}
          </p>
          <p>
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
      </footer>
    </div>
  );
}
