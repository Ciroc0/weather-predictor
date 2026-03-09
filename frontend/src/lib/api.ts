import type { DashboardResponse } from "@/types/weather";

export const DASHBOARD_QUERY_KEY = ["dashboard-snapshot"] as const;

export async function fetchDashboardSnapshot(): Promise<DashboardResponse> {
  const response = await fetch("/api/dashboard", {
    headers: {
      Accept: "application/json",
    },
  });
  const payload = (await response.json()) as Partial<DashboardResponse> & {
    error?: string;
  };

  if (!response.ok || !payload.snapshot) {
    throw new Error(payload.error || "Kunne ikke hente dashboard-data.");
  }

  return payload as DashboardResponse;
}
