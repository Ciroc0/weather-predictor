import type {
  CurrentWeather,
  DashboardSnapshot,
  LeadBucketPerformance,
  VerificationMetrics,
  WeatherForecast,
} from "@/types/weather";

export function formatDanishDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDanishDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDanishTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("da-DK", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getWeatherDescription(code: number | null): string {
  const descriptions: Record<number, string> = {
    0: "Klar himmel",
    1: "Mest klart",
    2: "Delvist skyet",
    3: "Overskyet",
    45: "Tåge",
    48: "Rimtåge",
    51: "Let støvregn",
    53: "Moderat støvregn",
    55: "Kraftig støvregn",
    61: "Let regn",
    63: "Moderat regn",
    65: "Kraftig regn",
    71: "Let sne",
    73: "Moderat sne",
    75: "Kraftig sne",
    80: "Regnbyger",
    81: "Moderate regnbyger",
    82: "Kraftige regnbyger",
    95: "Tordenvejr",
  };
  if (code === null) {
    return "Ingen vejrkode";
  }
  return descriptions[code] || "Ukendt vejr";
}

export function getWindDirectionLabel(degrees: number | null): string {
  if (degrees === null) {
    return "Ukendt";
  }
  const directions = ["N", "NØ", "Ø", "SØ", "S", "SV", "V", "NV"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function formatMetric(value: number | null, suffix = "", decimals = 1): string {
  if (value === null || Number.isNaN(value)) {
    return "Ingen data";
  }
  return `${value.toFixed(decimals)}${suffix}`;
}

export function getCurrentOrFallback(snapshot: DashboardSnapshot): CurrentWeather {
  return snapshot.current;
}

export function getForecastPreview(forecast: WeatherForecast[], count = 12): WeatherForecast[] {
  return forecast.slice(0, count);
}

export function getTemperatureImprovementText(verification: VerificationMetrics): string {
  if (verification.rmseDmi === null || verification.rmseMl === null || verification.rmseDmi <= 0) {
    return "ML-modellen sammenlignes løbende med DMI.";
  }
  const improvement = ((verification.rmseDmi - verification.rmseMl) / verification.rmseDmi) * 100;
  return improvement > 0
    ? `${improvement.toFixed(0)}% lavere RMSE end DMI i ${verification.periodLabel.toLowerCase()}.`
    : "ML-modellen er aktiv, men uden dokumenteret temperaturgevinst i seneste periode.";
}

export function getLeadBucketSummary(
  leadBuckets: LeadBucketPerformance[],
  target: LeadBucketPerformance["target"],
): LeadBucketPerformance[] {
  return leadBuckets.filter((bucket) => bucket.target === target);
}

export function getAlertSummary(snapshot: DashboardSnapshot): string {
  if (snapshot.alerts.length === 0) {
    return "Ingen aktive vejrvarsler i snapshot.";
  }
  return snapshot.alerts[0].message;
}
