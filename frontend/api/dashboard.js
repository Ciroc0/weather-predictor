const HF_PREDICTIONS_DATASET =
  process.env.HF_PREDICTIONS_DATASET || "Ciroc0/dmi-aarhus-predictions";
const HF_FRONTEND_SNAPSHOT_FILE =
  process.env.HF_FRONTEND_SNAPSHOT_FILE || "frontend_snapshot.json";
const HF_TOKEN = process.env.HF_TOKEN;
const CACHE_TTL_MS = 5 * 60 * 1000;

const TARGET_LABELS = {
  temperature: "Temperatur",
  wind_speed: "Vindhastighed",
  wind_gust: "Vindstød",
  rain_event: "Regnrisiko",
  rain_amount: "Regnmængde",
};

const EXPLANATIONS = {
  forecast:
    "Du ser DMI's prognose side om side med vores ML-justering, når der er en aktiv model.",
  performance:
    "Her kan du sammenligne, hvad DMI sagde, hvad ML sagde, og hvad vejret faktisk endte med at blive.",
  sources:
    "DMI er grundprognosen. ML er vores lokale justering. Hvis en ML-model ikke er aktiv, viser vi DMI direkte.",
};

const LEAD_BUCKET_ORDER = ["1-6", "7-12", "13-24", "25-48"];

let cache = {
  expiresAt: 0,
  snapshot: null,
  fetchedAt: null,
};

function buildSnapshotUrl() {
  const encodedDataset = encodeURIComponent(HF_PREDICTIONS_DATASET).replace("%2F", "/");
  const encodedFile = encodeURIComponent(HF_FRONTEND_SNAPSHOT_FILE);
  return `https://huggingface.co/datasets/${encodedDataset}/resolve/main/${encodedFile}?download=true`;
}

function toFiniteNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function chooseEffectiveValue(mlValue, dmiValue, hasActiveModel) {
  if (hasActiveModel && mlValue !== null) {
    return { value: mlValue, source: "ml" };
  }
  if (dmiValue !== null) {
    return { value: dmiValue, source: "dmi" };
  }
  if (mlValue !== null) {
    return { value: mlValue, source: "ml" };
  }
  return { value: null, source: "dmi" };
}

function getLeadBucketRowsForTarget(leadBuckets, target) {
  return (leadBuckets || []).filter((bucket) => bucket?.target === target);
}

function inferHasActiveModel(snapshot, target) {
  if (snapshot?.targetStatus?.[target]?.hasActiveModel !== undefined) {
    return Boolean(snapshot.targetStatus[target].hasActiveModel);
  }

  const targetBuckets = getLeadBucketRowsForTarget(snapshot?.leadBuckets, target);
  if (targetBuckets.length > 0) {
    return targetBuckets.some((bucket) => toFiniteNumber(bucket?.improvementPct, 0) > 0);
  }

  return false;
}

function buildTargetStatus(snapshot) {
  const targetStatus = {};

  for (const target of Object.keys(TARGET_LABELS)) {
    const rawStatus = snapshot?.targetStatus?.[target];
    if (rawStatus) {
      targetStatus[target] = {
        hasActiveModel: Boolean(rawStatus.hasActiveModel),
        activeBuckets: LEAD_BUCKET_ORDER.filter((bucket) =>
          (rawStatus.activeBuckets || []).includes(bucket),
        ),
        statusLabel:
          rawStatus.statusLabel ||
          (rawStatus.hasActiveModel ? "ML aktiv" : "Vises som DMI-prognose"),
        statusDescription:
          rawStatus.statusDescription ||
          (rawStatus.hasActiveModel
            ? `ML bruges aktivt for ${TARGET_LABELS[target].toLowerCase()}, når den findes i forecastet.`
            : `Vi viser DMI direkte for ${TARGET_LABELS[target].toLowerCase()}, fordi der ikke er en aktiv ML-model endnu.`),
      };
      continue;
    }

    const hasActiveModel = inferHasActiveModel(snapshot, target);
    targetStatus[target] = {
      hasActiveModel,
      activeBuckets: LEAD_BUCKET_ORDER.filter((bucket) =>
        getLeadBucketRowsForTarget(snapshot?.leadBuckets, target).some((row) => row?.bucket === bucket),
      ),
      statusLabel: hasActiveModel ? "ML aktiv" : "Vises som DMI-prognose",
      statusDescription: hasActiveModel
        ? `ML bruges aktivt for ${TARGET_LABELS[target].toLowerCase()}, når den findes i forecastet.`
        : `Vi viser DMI direkte for ${TARGET_LABELS[target].toLowerCase()}, fordi der ikke er en aktiv ML-model endnu.`,
    };
  }

  return targetStatus;
}

function normalizeForecastRow(row, targetStatus) {
  const dmiTemp = toFiniteNumber(row?.dmiTemp);
  const mlTemp = toFiniteNumber(row?.mlTemp);
  const dmiWindSpeed = toFiniteNumber(row?.dmiWindSpeed);
  const mlWindSpeed = toFiniteNumber(row?.mlWindSpeed);
  const dmiWindGust = toFiniteNumber(row?.dmiWindGust);
  const mlWindGust = toFiniteNumber(row?.mlWindGust);
  const dmiRainProb = toFiniteNumber(row?.dmiRainProb, 0) ?? 0;
  const mlRainProb = toFiniteNumber(row?.mlRainProb, 0) ?? 0;
  const dmiRainAmount = toFiniteNumber(row?.dmiRainAmount, 0) ?? 0;
  const mlRainAmount = toFiniteNumber(row?.mlRainAmount, 0) ?? 0;

  const effectiveTemp =
    row?.effectiveTemp !== undefined
      ? {
          value: toFiniteNumber(row.effectiveTemp),
          source: row?.effectiveTempSource === "ml" ? "ml" : "dmi",
        }
      : chooseEffectiveValue(mlTemp, dmiTemp, targetStatus.temperature.hasActiveModel);
  const effectiveWindSpeed =
    row?.effectiveWindSpeed !== undefined
      ? {
          value: toFiniteNumber(row.effectiveWindSpeed),
          source: row?.effectiveWindSpeedSource === "ml" ? "ml" : "dmi",
        }
      : chooseEffectiveValue(
          mlWindSpeed,
          dmiWindSpeed,
          targetStatus.wind_speed.hasActiveModel,
        );
  const effectiveWindGust =
    row?.effectiveWindGust !== undefined
      ? {
          value: toFiniteNumber(row.effectiveWindGust),
          source: row?.effectiveWindGustSource === "ml" ? "ml" : "dmi",
        }
      : chooseEffectiveValue(
          mlWindGust,
          dmiWindGust,
          targetStatus.wind_gust.hasActiveModel,
        );
  const effectiveRainProb =
    row?.effectiveRainProb !== undefined
      ? {
          value: toFiniteNumber(row.effectiveRainProb, 0) ?? 0,
          source: row?.effectiveRainProbSource === "ml" ? "ml" : "dmi",
        }
      : chooseEffectiveValue(
          mlRainProb,
          dmiRainProb,
          targetStatus.rain_event.hasActiveModel,
        );
  const effectiveRainAmount =
    row?.effectiveRainAmount !== undefined
      ? {
          value: toFiniteNumber(row.effectiveRainAmount, 0) ?? 0,
          source: row?.effectiveRainAmountSource === "ml" ? "ml" : "dmi",
        }
      : chooseEffectiveValue(
          mlRainAmount,
          dmiRainAmount,
          targetStatus.rain_amount.hasActiveModel,
        );

  return {
    timestamp: row?.timestamp || null,
    hour: toFiniteNumber(row?.hour, 0) ?? 0,
    leadTimeHours: toFiniteNumber(row?.leadTimeHours, 0) ?? 0,
    dmiTemp,
    mlTemp,
    effectiveTemp: effectiveTemp.value,
    effectiveTempSource: effectiveTemp.source,
    apparentTemp: toFiniteNumber(row?.apparentTemp),
    dmiWindSpeed,
    mlWindSpeed,
    effectiveWindSpeed: effectiveWindSpeed.value,
    effectiveWindSpeedSource: effectiveWindSpeed.source,
    dmiWindGust,
    mlWindGust,
    effectiveWindGust: effectiveWindGust.value,
    effectiveWindGustSource: effectiveWindGust.source,
    windDirection: toFiniteNumber(row?.windDirection),
    dmiRainProb,
    mlRainProb,
    effectiveRainProb: effectiveRainProb.value ?? 0,
    effectiveRainProbSource: effectiveRainProb.source,
    dmiRainAmount,
    mlRainAmount,
    effectiveRainAmount: effectiveRainAmount.value ?? 0,
    effectiveRainAmountSource: effectiveRainAmount.source,
    weatherCode: toFiniteNumber(row?.weatherCode),
    cloudCover: toFiniteNumber(row?.cloudCover),
    humidity: toFiniteNumber(row?.humidity),
    pressure: toFiniteNumber(row?.pressure),
  };
}

function normalizeCurrent(current, firstForecastRow) {
  const fallback = firstForecastRow || {};
  const dmiTemp = toFiniteNumber(current?.dmiTemp, fallback.dmiTemp);
  const mlTemp = toFiniteNumber(current?.mlTemp, fallback.mlTemp);
  const dmiWindSpeed = toFiniteNumber(current?.dmiWindSpeed, fallback.dmiWindSpeed);
  const mlWindSpeed = toFiniteNumber(current?.mlWindSpeed, fallback.mlWindSpeed);
  const dmiWindGust = toFiniteNumber(current?.dmiWindGust, fallback.dmiWindGust);
  const mlWindGust = toFiniteNumber(current?.mlWindGust, fallback.mlWindGust);
  const dmiRainProb = toFiniteNumber(current?.dmiRainProb, fallback.dmiRainProb ?? 0) ?? 0;
  const mlRainProb = toFiniteNumber(current?.mlRainProb, fallback.mlRainProb ?? 0) ?? 0;
  const dmiRainAmount = toFiniteNumber(current?.dmiRainAmount, fallback.dmiRainAmount ?? 0) ?? 0;
  const mlRainAmount = toFiniteNumber(current?.mlRainAmount, fallback.mlRainAmount ?? 0) ?? 0;

  return {
    timestamp: current?.timestamp || fallback.timestamp || null,
    temp: toFiniteNumber(current?.temp, fallback.effectiveTemp),
    dmiTemp,
    mlTemp,
    tempSource: current?.tempSource === "ml" ? "ml" : fallback.effectiveTempSource || "dmi",
    apparentTemp: toFiniteNumber(current?.apparentTemp, fallback.apparentTemp),
    windSpeed: toFiniteNumber(current?.windSpeed, fallback.effectiveWindSpeed),
    dmiWindSpeed,
    mlWindSpeed,
    windSpeedSource:
      current?.windSpeedSource === "ml" ? "ml" : fallback.effectiveWindSpeedSource || "dmi",
    windGust: toFiniteNumber(current?.windGust, fallback.effectiveWindGust),
    dmiWindGust,
    mlWindGust,
    windGustSource:
      current?.windGustSource === "ml" ? "ml" : fallback.effectiveWindGustSource || "dmi",
    windDirection: toFiniteNumber(current?.windDirection, fallback.windDirection),
    rainProb: toFiniteNumber(current?.rainProb, fallback.effectiveRainProb ?? 0) ?? 0,
    dmiRainProb,
    mlRainProb,
    rainProbSource:
      current?.rainProbSource === "ml" ? "ml" : fallback.effectiveRainProbSource || "dmi",
    rainAmount: toFiniteNumber(current?.rainAmount, fallback.effectiveRainAmount ?? 0) ?? 0,
    dmiRainAmount,
    mlRainAmount,
    rainAmountSource:
      current?.rainAmountSource === "ml" ? "ml" : fallback.effectiveRainAmountSource || "dmi",
    humidity: toFiniteNumber(current?.humidity, fallback.humidity),
    pressure: toFiniteNumber(current?.pressure, fallback.pressure),
    cloudCover: toFiniteNumber(current?.cloudCover, fallback.cloudCover),
    weatherCode: toFiniteNumber(current?.weatherCode, fallback.weatherCode),
  };
}

function normalizeHistory(history) {
  return {
    temperature: Array.isArray(history?.temperature) ? history.temperature : [],
    wind: Array.isArray(history?.wind) ? history.wind : [],
    rain: Array.isArray(history?.rain) ? history.rain : [],
  };
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Snapshot mangler eller har ugyldigt format.");
  }

  const targetStatus = buildTargetStatus(snapshot);
  const forecast = Array.isArray(snapshot.forecast)
    ? snapshot.forecast.map((row) => normalizeForecastRow(row, targetStatus))
    : [];
  const firstForecastRow = forecast[0] || null;

  return {
    location: {
      name: snapshot?.location?.name || "Aarhus",
      timezone: snapshot?.location?.timezone || "Europe/Copenhagen",
    },
    generatedAt: snapshot.generatedAt || new Date().toISOString(),
    targetLabels: snapshot.targetLabels || TARGET_LABELS,
    explanations: {
      forecast: snapshot?.explanations?.forecast || EXPLANATIONS.forecast,
      performance: snapshot?.explanations?.performance || EXPLANATIONS.performance,
      sources: snapshot?.explanations?.sources || EXPLANATIONS.sources,
    },
    targetStatus,
    current: normalizeCurrent(snapshot.current, firstForecastRow),
    forecast,
    history: normalizeHistory(snapshot.history),
    verification: {
      target: snapshot?.verification?.target || "temperature",
      periodLabel:
        snapshot?.verification?.periodLabel || "Ingen verificeret historik endnu",
      rmseDmi: toFiniteNumber(snapshot?.verification?.rmseDmi),
      rmseMl: toFiniteNumber(snapshot?.verification?.rmseMl),
      maeDmi: toFiniteNumber(snapshot?.verification?.maeDmi),
      maeMl: toFiniteNumber(snapshot?.verification?.maeMl),
      winRate: toFiniteNumber(snapshot?.verification?.winRate),
      totalPredictions: toFiniteNumber(snapshot?.verification?.totalPredictions, 0) ?? 0,
    },
    leadBuckets: Array.isArray(snapshot.leadBuckets) ? snapshot.leadBuckets : [],
    featureImportance: Array.isArray(snapshot.featureImportance)
      ? snapshot.featureImportance
      : [],
    modelInfo: {
      trainedAt: snapshot?.modelInfo?.trainedAt || null,
      trainingSamples: toFiniteNumber(snapshot?.modelInfo?.trainingSamples),
      targets: Array.isArray(snapshot?.modelInfo?.targets) ? snapshot.modelInfo.targets : [],
      registryGeneratedAt: snapshot?.modelInfo?.registryGeneratedAt || null,
    },
    alerts: Array.isArray(snapshot.alerts) ? snapshot.alerts : [],
  };
}

async function fetchSnapshot() {
  const headers = {};
  if (HF_TOKEN) {
    headers.Authorization = `Bearer ${HF_TOKEN}`;
  }

  const response = await fetch(buildSnapshotUrl(), {
    headers,
  });

  if (!response.ok) {
    throw new Error(`HF snapshot request failed with status ${response.status}`);
  }

  return response.json();
}

export default async function handler(_req, res) {
  const now = Date.now();
  if (cache.snapshot && cache.expiresAt > now) {
    return res.status(200).json({
      snapshot: cache.snapshot,
      stale: false,
      fetchedAt: cache.fetchedAt,
      source: "cache",
    });
  }

  try {
    const rawSnapshot = await fetchSnapshot();
    const snapshot = normalizeSnapshot(rawSnapshot);
    cache = {
      snapshot,
      fetchedAt: new Date().toISOString(),
      expiresAt: now + CACHE_TTL_MS,
    };

    return res.status(200).json({
      snapshot,
      stale: false,
      fetchedAt: cache.fetchedAt,
      source: "huggingface",
    });
  } catch (error) {
    if (cache.snapshot) {
      return res.status(200).json({
        snapshot: cache.snapshot,
        stale: true,
        fetchedAt: cache.fetchedAt,
        source: "stale-cache",
        error: error instanceof Error ? error.message : "Snapshot fetch failed",
      });
    }

    return res.status(503).json({
      error: error instanceof Error ? error.message : "Snapshot fetch failed",
    });
  }
}
