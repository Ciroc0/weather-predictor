import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";

import { Navigation } from "@/components/Navigation";
import { PageState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { DASHBOARD_QUERY_KEY } from "@/lib/api";
import { useDashboardData } from "@/hooks/useDashboardData";
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
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-600 dark:text-slate-400 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <p>
            <strong>Aarhus Vejr</strong> sammenligner DMI's vejrprognoser med vores ML-modeller. 
            Se om kunstig intelligens kan forudsige vejret bedre end meteorologerne.
          </p>
          <p>
            {response
              ? `Snapshot: ${formatDanishDateTime(response.snapshot.generatedAt)}`
              : "Ingen snapshot indlæst"}
          </p>
        </div>
      </footer>
    </div>
  );
}
