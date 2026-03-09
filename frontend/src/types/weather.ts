export type ForecastTarget =
  | "temperature"
  | "wind_speed"
  | "wind_gust"
  | "rain_event"
  | "rain_amount";

export type WeatherTab = "temperatur" | "vind" | "regn" | "performance";

export interface CurrentWeather {
  timestamp: string;
  temp: number | null;
  apparentTemp: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: number | null;
  rainProb: number;
  rainAmount: number;
  humidity: number | null;
  pressure: number | null;
  cloudCover: number | null;
  weatherCode: number | null;
}

export interface WeatherForecast {
  timestamp: string;
  hour: number;
  leadTimeHours: number;
  dmiTemp: number | null;
  mlTemp: number | null;
  apparentTemp: number | null;
  dmiWindSpeed: number | null;
  mlWindSpeed: number | null;
  dmiWindGust: number | null;
  mlWindGust: number | null;
  windDirection: number | null;
  dmiRainProb: number;
  mlRainProb: number;
  dmiRainAmount: number;
  mlRainAmount: number;
  weatherCode: number | null;
  cloudCover: number | null;
  humidity: number | null;
  pressure: number | null;
}

export interface VerificationMetrics {
  periodLabel: string;
  rmseDmi: number | null;
  rmseMl: number | null;
  maeDmi: number | null;
  maeMl: number | null;
  winRate: number | null;
  totalPredictions: number;
}

export interface LeadBucketPerformance {
  bucket: "1-6" | "7-12" | "13-24" | "25-48";
  label: string;
  baselineMetric: number | null;
  mlMetric: number | null;
  improvementPct: number | null;
  target: ForecastTarget;
}

export interface FeatureImportance {
  target: ForecastTarget | string;
  feature: string;
  importance: number;
}

export interface ModelInfo {
  trainedAt: string | null;
  trainingSamples: number | null;
  targets: string[];
  registryGeneratedAt: string | null;
}

export interface WeatherAlert {
  type: "wind" | "rain" | "data";
  severity: "info" | "warning";
  title: string;
  message: string;
}

export interface DashboardSnapshot {
  location: {
    name: "Aarhus";
    timezone: "Europe/Copenhagen";
  };
  generatedAt: string;
  current: CurrentWeather;
  forecast: WeatherForecast[];
  verification: VerificationMetrics;
  leadBuckets: LeadBucketPerformance[];
  featureImportance: FeatureImportance[];
  modelInfo: ModelInfo;
  alerts: WeatherAlert[];
}

export interface DashboardResponse {
  snapshot: DashboardSnapshot;
  stale: boolean;
  fetchedAt: string | null;
  source: string;
  error?: string;
}
