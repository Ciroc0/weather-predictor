import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Cloud, Heart, ArrowUpRight } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { PageState } from "@/components/PageState";
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
    <div className="relative min-h-screen bg-aether-bg">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/[0.02] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <Navigation
        lastUpdated={response?.snapshot.generatedAt ?? null}
        onRefresh={handleRefresh}
        isRefreshing={dashboardQuery.isFetching}
        isStale={response?.stale ?? false}
      />

      <main className="relative z-10 px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
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
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.12] transition-colors border border-white/[0.08]"
                >
                  Prøv igen
                </button>
              }
            />
          ) : response ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Outlet context={{ response } satisfies DashboardOutletContext} />
            </motion.div>
          ) : (
            <PageState mode="empty" />
          )}
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#020617]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/[0.08]">
                  <Cloud className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-base font-bold text-white">
                  Aarhus <span className="text-gradient-cyan">Vejr</span>
                </span>
              </Link>
              <p className="text-sm text-aether-text-tertiary leading-relaxed max-w-xs">
                ML-drevet vejrprognose for Aarhus. Sammenligner DMI's data med avancerede maskinlæringsmodeller trænet på lokale vejrobservationer.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Navigation</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: "/", label: "Oversigt" },
                  { to: "/temperatur", label: "Temperatur" },
                  { to: "/vind", label: "Vind" },
                  { to: "/regn", label: "Regn" },
                  { to: "/performance", label: "Performance" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="group flex items-center gap-1 text-sm text-aether-text-tertiary hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Data Source */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Datakilder</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-sm text-aether-text-secondary">Hugging Face Datasets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-coral" />
                  <span className="text-sm text-aether-text-secondary">DMI Open Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-aether-text-secondary">ML Model Predictions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-aether-text-tertiary flex items-center gap-1">
              Lavet med <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> i Aarhus
            </p>
            <p className="text-xs text-aether-text-tertiary">
              © {new Date().getFullYear()} Aarhus Vejr. Data fra DMI og Hugging Face.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
