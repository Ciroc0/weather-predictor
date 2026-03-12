import type {
  CurrentWeather,
  DashboardSnapshot,
  FeatureImportance,
  ForecastSource,
  ForecastTarget,
  LeadBucketPerformance,
  TargetLabels,
  TargetStatus,
  VerificationMetrics,
  WeatherForecast,
} from "@/types/weather";

const COPENHAGEN_TIME_ZONE = "Europe/Copenhagen";

const danishDateFormatter = new Intl.DateTimeFormat("da-DK", {
  timeZone: COPENHAGEN_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const danishDateTimeFormatter = new Intl.DateTimeFormat("da-DK", {
  timeZone: COPENHAGEN_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const danishTimeFormatter = new Intl.DateTimeFormat("da-DK", {
  timeZone: COPENHAGEN_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const danishShortDateFormatter = new Intl.DateTimeFormat("da-DK", {
  timeZone: COPENHAGEN_TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const danishTooltipDateFormatter = new Intl.DateTimeFormat("da-DK", {
  timeZone: COPENHAGEN_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function parseIsoDate(dateValue: string | null | undefined): Date | null {
  if (typeof dateValue !== "string" || !dateValue.trim()) {
    return null;
  }

  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWithFormatter(
  dateValue: string | null | undefined,
  formatter: Intl.DateTimeFormat,
  fallback: string,
): string {
  const parsed = parseIsoDate(dateValue);
  return parsed ? formatter.format(parsed) : fallback;
}

export function isValidIsoDateString(dateValue: unknown): dateValue is string {
  return parseIsoDate(typeof dateValue === "string" ? dateValue : null) !== null;
}

export function getForecastTimestamp(row: Pick<WeatherForecast, "timestamp" | "hour">): string | null {
  if (isValidIsoDateString(row.timestamp)) {
    return row.timestamp;
  }

  if (typeof row.hour === "string" && isValidIsoDateString(row.hour)) {
    return row.hour;
  }

  return null;
}

export function formatDanishDate(dateStr: string | null | undefined): string {
  return formatWithFormatter(dateStr, danishDateFormatter, "Ukendt");
}

export function formatDanishDateTime(dateStr: string | null | undefined): string {
  return formatWithFormatter(dateStr, danishDateTimeFormatter, "Ukendt");
}

export function formatDanishTime(dateStr: string | null | undefined): string {
  return formatWithFormatter(dateStr, danishTimeFormatter, "Ukendt");
}

export function formatShortDate(dateStr: string | null | undefined): string {
  return formatWithFormatter(dateStr, danishShortDateFormatter, "");
}

export function formatTooltipDateTime(dateStr: string | null | undefined): string {
  return formatWithFormatter(dateStr, danishTooltipDateFormatter, "Ukendt");
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
  const directions = ["N", "NO", "O", "SO", "S", "SV", "V", "NV"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function formatMetric(value: number | null, suffix = "", decimals = 1): string {
  if (value === null || Number.isNaN(value)) {
    return "Ingen data";
  }
  return `${value.toFixed(decimals)}${suffix}`;
}

export function getSourceLabel(source: ForecastSource): string {
  return source === "ml" ? "ML-prognose" : "DMI-prognose";
}

export function getSourceShortLabel(source: ForecastSource): string {
  return source === "ml" ? "ML" : "DMI";
}

export function getTargetLabel(
  labels: TargetLabels | undefined,
  target: ForecastTarget,
): string {
  return labels?.[target] || target;
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
    ? `${improvement.toFixed(0)}% lavere gennemsnitlig fejl end DMI i ${verification.periodLabel.toLowerCase()}.`
    : "ML-modellen er aktiv, men uden dokumenteret forbedring i den seneste periode.";
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

export function getTargetStatusSummary(
  targetStatus: Record<ForecastTarget, TargetStatus>,
  labels: TargetLabels,
): string[] {
  return (Object.keys(targetStatus) as ForecastTarget[]).map((target) => {
    return `${getTargetLabel(labels, target)}: ${targetStatus[target].statusLabel}`;
  });
}

export function getForecastPrimaryValue(
  row: WeatherForecast,
  target: ForecastTarget,
): { value: number | null; source: ForecastSource } {
  if (target === "temperature") {
    return { value: row.effectiveTemp, source: row.effectiveTempSource };
  }
  if (target === "wind_speed") {
    return { value: row.effectiveWindSpeed, source: row.effectiveWindSpeedSource };
  }
  if (target === "wind_gust") {
    return { value: row.effectiveWindGust, source: row.effectiveWindGustSource };
  }
  if (target === "rain_event") {
    return { value: row.effectiveRainProb, source: row.effectiveRainProbSource };
  }
  return { value: row.effectiveRainAmount, source: row.effectiveRainAmountSource };
}

export function getReadableMetricName(metric: "rmse" | "mae" | "winRate"): string {
  if (metric === "rmse") {
    return "Gennemsnitlig præcision (lavere er bedre)";
  }
  if (metric === "mae") {
    return "Typisk afvigelse fra virkeligheden";
  }
  return "Hvor ofte ML ramte rigtigst";
}

export function humanizeFeatureName(feature: string): string {
  const readable = feature
    .replace(/^dmi_/, "DMI's ")
    .replace(/^ml_/, "ML ")
    .replace(/_/g, " ")
    .replace(/\b2m\b/g, "2 meter")
    .replace(/\b10m\b/g, "10 meter")
    .replace(/temperature/, "temperatur")
    .replace(/windspeed/, "vindhastighed")
    .replace(/windgusts/, "vindstød")
    .replace(/precipitation/, "nedbør")
    .replace(/probability/, "sandsynlighed")
    .replace(/pressure/, "lufttryk")
    .replace(/humidity/, "luftfugtighed")
    .replace(/cloudcover/, "skydække")
    .replace(/prediction/, "prognose")
    .trim();
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

export function getFeatureTargetBadge(
  feature: FeatureImportance,
  labels: TargetLabels,
): string {
  return getTargetLabel(labels, feature.target as ForecastTarget);
}
