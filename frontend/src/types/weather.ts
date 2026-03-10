export type ForecastTarget =
  | "temperature"
  | "wind_speed"
  | "wind_gust"
  | "rain_event"
  | "rain_amount";

export type WeatherTab = "temperatur" | "vind" | "regn" | "performance";

export type ForecastSource = "ml" | "dmi";

export type TargetLabels = Record<ForecastTarget, string>;

export interface DashboardExplanations {
  forecast: string;
  performance: string;
  sources: string;
}

export interface TargetStatus {
  hasActiveModel: boolean;
  activeBuckets: Array<"1-6" | "7-12" | "13-24" | "25-48">;
  statusLabel: string;
  statusDescription: string;
}

export interface CurrentWeather {
  timestamp?: string;  // Optional - not always present from API
  temp: number | null;
  dmiTemp: number | null;
  mlTemp: number | null;
  tempSource: ForecastSource;
  apparentTemp: number | null;
  windSpeed: number | null;
  dmiWindSpeed: number | null;
  mlWindSpeed: number | null;
  windSpeedSource: ForecastSource;
  windGust: number | null;
  dmiWindGust: number | null;
  mlWindGust: number | null;
  windGustSource: ForecastSource;
  windDirection: number | null;
  rainProb: number;
  dmiRainProb: number;
  mlRainProb: number;
  rainProbSource: ForecastSource;
  rainAmount: number;
  dmiRainAmount: number;
  mlRainAmount: number;
  rainAmountSource: ForecastSource;
  humidity: number | null;
  pressure: number | null;
  cloudCover: number | null;
  weatherCode: number | null;
}

export interface WeatherForecast {
  timestamp: string;  // ISO timestamp
  hour: string;  // ISO timestamp (same as timestamp, for backwards compat)
  leadTimeHours: number;
  dmiTemp: number | null;
  mlTemp: number | null;
  effectiveTemp: number | null;
  effectiveTempSource: ForecastSource;
  apparentTemp: number | null;
  dmiWindSpeed: number | null;
  mlWindSpeed: number | null;
  effectiveWindSpeed: number | null;
  effectiveWindSpeedSource: ForecastSource;
  dmiWindGust: number | null;
  mlWindGust: number | null;
  effectiveWindGust: number | null;
  effectiveWindGustSource: ForecastSource;
  windDirection: number | null;
  dmiRainProb: number;
  mlRainProb: number;
  effectiveRainProb: number;
  effectiveRainProbSource: ForecastSource;
  dmiRainAmount: number;
  mlRainAmount: number;
  effectiveRainAmount: number;
  effectiveRainAmountSource: ForecastSource;
  weatherCode: number | null;
  cloudCover: number | null;
  humidity: number | null;
  pressure: number | null;
}

export interface VerificationMetrics {
  target: ForecastTarget;
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

export interface HistoricalTemperaturePoint {
  timestamp: string;
  dmiTemp: number | null;
  mlTemp: number | null;
  actualTemp: number | null;
  verified: boolean;
}

export interface HistoricalWindPoint {
  timestamp: string;
  dmiWindSpeed: number | null;
  mlWindSpeed: number | null;
  actualWindSpeed: number | null;
  dmiWindGust: number | null;
  mlWindGust: number | null;
  actualWindGust: number | null;
  verified: boolean;
}

export interface HistoricalRainPoint {
  timestamp: string;
  dmiRainProb: number;
  mlRainProb: number;
  actualRainEvent: number | null;
  dmiRainAmount: number;
  mlRainAmount: number;
  actualRainAmount: number | null;
  verified: boolean;
}

export interface DashboardHistory {
  temperature: HistoricalTemperaturePoint[];
  wind: HistoricalWindPoint[];
  rain: HistoricalRainPoint[];
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
  targetLabels: TargetLabels;
  explanations: DashboardExplanations;
  targetStatus: Record<ForecastTarget, TargetStatus>;
  current: CurrentWeather;
  forecast: WeatherForecast[];
  history: DashboardHistory;
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
