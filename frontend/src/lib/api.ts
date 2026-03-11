import { isValidIsoDateString } from "@/lib/weather";
import type { DashboardResponse, HistoricalTemperaturePoint, WeatherForecast } from "@/types/weather";

export const DASHBOARD_QUERY_KEY = ["dashboard-snapshot"] as const;

function normalizeForecastRow(
  row: WeatherForecast,
  fallbackTimestamp: string,
): WeatherForecast {
  const timestamp = isValidIsoDateString(row.timestamp)
    ? row.timestamp
    : typeof row.hour === "string" && isValidIsoDateString(row.hour)
      ? row.hour
      : fallbackTimestamp;

  return {
    ...row,
    timestamp,
    hour: typeof row.hour === "string" && isValidIsoDateString(row.hour) ? row.hour : row.hour,
  };
}

function normalizeTemperaturePoint(row: HistoricalTemperaturePoint): HistoricalTemperaturePoint {
  return {
    ...row,
    actual: row.actual ?? row.actualTemp ?? null,
  };
}

function normalizeDashboardResponse(response: DashboardResponse): DashboardResponse {
  return {
    ...response,
    snapshot: {
      ...response.snapshot,
      forecast: response.snapshot.forecast.map((row) =>
        normalizeForecastRow(row, response.snapshot.generatedAt),
      ),
      history: {
        ...response.snapshot.history,
        temperature: response.snapshot.history.temperature.map(normalizeTemperaturePoint),
      },
    },
  };
}

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

  return normalizeDashboardResponse(payload as DashboardResponse);
}
