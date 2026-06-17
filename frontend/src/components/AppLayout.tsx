import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Cloud } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { PageState } from "@/components/PageState";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DASHBOARD_QUERY_KEY } from "@/lib/api";
import { formatDanishDateTime } from "@/lib/weather";
import type { DashboardResponse } from "@/types/weather";

export interface DashboardOutletContext {
  response: DashboardResponse;
}

const footerLinks = [
  { to: "/", label: "Oversigt" },
  { to: "/temperatur", label: "Temperatur" },
  { to: "/vind", label: "Vind" },
  { to: "/regn", label: "Regn" },
  { to: "/performance", label: "Performance" },
];

export function AppLayout() {
  const queryClient = useQueryClient();
  const dashboardQuery = useDashboardData();

  const response = useMemo(() => dashboardQuery.data, [dashboardQuery.data]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f4f6f8]">
      <Navigation
        lastUpdated={response?.snapshot.generatedAt ?? null}
        onRefresh={handleRefresh}
        isRefreshing={dashboardQuery.isFetching}
        isStale={response?.stale ?? false}
      />

      <main className="px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1360px]">
          {dashboardQuery.isLoading && !response ? (
            <PageState mode="loading" />
          ) : dashboardQuery.isError && !response ? (
            <PageState
              mode="error"
              title="Kunne ikke hente vejrdata"
              description={
                dashboardQuery.error instanceof Error
                  ? dashboardQuery.error.message
                  : "Kunne ikke hente data fra Hugging Face. Prov igen om lidt."
              }
              action={
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-[#11151a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#151a20]"
                >
                  Prov igen
                </button>
              }
            />
          ) : response ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet context={{ response } satisfies DashboardOutletContext} />
            </motion.div>
          ) : (
            <PageState mode="empty" />
          )}
        </div>
      </main>

      <footer className="border-t border-white/[0.08] bg-[#08090b]">
        <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.1] bg-[#101216]">
                <Cloud className="h-4 w-4 text-[#11c5d6]" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-white">Aarhus Vejr</span>
            </Link>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#8d96a0]">
              ML-drevet prognose for Aarhus. DMI er baseline, ML er lokal justering.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="metric-label">Navigation</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {footerLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-sm text-[#9aa3ad] transition-colors hover:text-[#11c5d6]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="metric-label">Data meta</p>
              <div className="mt-3 grid gap-2 text-sm text-[#9aa3ad] sm:grid-cols-2">
                <div className="rounded-md border border-white/[0.08] bg-[#0c0e11] px-3 py-2">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-[#68717b]">Source</span>
                  <span className="mt-1 block font-medium text-[#d8dde3]">{response?.source ?? "Ukendt"}</span>
                </div>
                <div className="rounded-md border border-white/[0.08] bg-[#0c0e11] px-3 py-2">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-[#68717b]">Fetched</span>
                  <span className="mt-1 block font-medium text-[#d8dde3]">
                    {response?.fetchedAt ? formatDanishDateTime(response.fetchedAt) : "Ukendt"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
