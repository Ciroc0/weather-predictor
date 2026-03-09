import { useQuery } from "@tanstack/react-query";

import { DASHBOARD_QUERY_KEY, fetchDashboardSnapshot } from "@/lib/api";

export function useDashboardData() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardSnapshot,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
