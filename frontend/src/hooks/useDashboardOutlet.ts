import { useOutletContext } from "react-router-dom";

import type { DashboardOutletContext } from "@/components/AppLayout";

export function useDashboardOutlet() {
  return useOutletContext<DashboardOutletContext>();
}
