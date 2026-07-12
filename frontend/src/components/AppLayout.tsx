import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";

import { Navigation } from "@/components/Navigation";
import { PageState } from "@/components/PageState";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DASHBOARD_QUERY_KEY } from "@/lib/api";
import { formatDanishDateTime } from "@/lib/weather";
import type { DashboardResponse } from "@/types/weather";

export interface DashboardOutletContext { response: DashboardResponse; }

export function AppLayout() {
  const queryClient = useQueryClient();
  const dashboardQuery = useDashboardData();
  const response = useMemo(() => dashboardQuery.data, [dashboardQuery.data]);
  const handleRefresh = async () => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });

  return (
    <div className="app-shell">
      <Navigation lastUpdated={response?.snapshot.generatedAt ?? null} onRefresh={handleRefresh} isRefreshing={dashboardQuery.isFetching} isStale={response?.stale ?? false} />
      <main className="site-main">
        {dashboardQuery.isLoading && !response ? <PageState mode="loading" /> :
          dashboardQuery.isError && !response ? <PageState mode="error" title="Kunne ikke hente vejrdata" description={dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "Kunne ikke hente data fra Hugging Face. Prøv igen om lidt."} action={<button onClick={handleRefresh} className="retry-button">Prøv igen</button>} /> :
          response ? <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}><Outlet context={{ response } satisfies DashboardOutletContext} /></motion.div> :
          <PageState mode="empty" />}
      </main>
      <footer className="site-footer">
        <span>Prognosen opdateres løbende fra Hugging Face.</span>
        <span>{response?.fetchedAt ? `Hentet ${formatDanishDateTime(response.fetchedAt)}` : "Afventer data"} · Tidspunkter vises i lokal tid</span>
      </footer>
    </div>
  );
}
