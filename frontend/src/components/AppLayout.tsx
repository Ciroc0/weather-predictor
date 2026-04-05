import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";

import { Navigation } from "@/components/Navigation";
import { PageState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DASHBOARD_QUERY_KEY } from "@/lib/api";
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
    <div className="flex min-h-screen flex-col bg-dashboard-bg">
      <Navigation
        lastUpdated={response?.snapshot.generatedAt ?? null}
        onRefresh={handleRefresh}
        isRefreshing={dashboardQuery.isFetching}
        isStale={response?.stale ?? false}
      />
      <main className="flex-grow px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
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
        </div>
      </main>
      
      {/* Dark Footer */}
      <footer className="border-t border-dashboard-border bg-[#1e222d] py-4 px-6">
        <div className="mx-auto max-w-[1400px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link className="text-dashboard-text-muted hover:text-white transition-colors" to="/">
              Oversigt
            </Link>
            <Link className="text-dashboard-text-muted hover:text-white transition-colors" to="/temperatur">
              Temperatur
            </Link>
            <Link className="text-dashboard-text-muted hover:text-white transition-colors" to="/privacy">
              Privatlivspolitik
            </Link>
            <Link className="text-dashboard-text-muted hover:text-white transition-colors" to="/leje">
              Leje
            </Link>
          </div>
          <p className="text-sm text-dashboard-text-muted">
            © Copyright fra Aarhus Vejr
          </p>
        </div>
      </footer>
    </div>
  );
}
