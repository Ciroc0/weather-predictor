// Use HF Datasets Server API to get data as JSON
const HF_DATASET_PREDICTIONS = "Ciroc0/dmi-aarhus-predictions";
const HF_DATASET_WEATHER = "Ciroc0/dmi-aarhus-weather-data";
const HF_TOKEN = process.env.HF_TOKEN;
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = {
  expiresAt: 0,
  data: null,
  fetchedAt: null,
};

async function fetchRowsFromHF(dataset, split = "train", offset = 0, length = 100) {
  // Use HF datasets-server API
  const url = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(dataset)}&config=default&split=${split}&offset=${offset}&length=${length}`;
  
  const headers = {};
  if (HF_TOKEN) {
    headers.Authorization = `Bearer ${HF_TOKEN}`;
  }
  
  console.log(`[HF API] Fetching: ${url}`);
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`[HF API] Error ${response.status}:`, text.substring(0, 500));
    throw new Error(`Failed to fetch ${dataset}: ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`[HF API] Got ${data.rows?.length || 0} rows`);
  
  // Return rows with their data
  return data.rows?.map(r => r.row) || [];
}

async function fetchAllRowsFromHF(dataset, split = "train") {
  const allRows = [];
  let offset = 0;
  const length = 100;
  const maxRows = 5000; // Safety limit
  
  while (allRows.length < maxRows) {
    const rows = await fetchRowsFromHF(dataset, split, offset, length);
    
    if (!rows || rows.length === 0) break;
    
    allRows.push(...rows);
    offset += length;
    
    // For predictions, we only need future data (~48 rows)
    if (dataset === HF_DATASET_PREDICTIONS && allRows.length >= 200) break;
  }
  
  console.log(`[HF API] Total rows from ${dataset}: ${allRows.length}`);
  return allRows;
}

function buildForecast(predictionsRows) {
  const forecast = [];
  const now = new Date();
  
  console.log(`[Build] Processing ${predictionsRows.length} prediction rows`);
  
  // Debug: log first row
  if (predictionsRows.length > 0) {
    console.log("[Build] First row:", JSON.stringify(predictionsRows[0]).substring(0, 300));
  }
  
  for (const row of predictionsRows) {
    const targetTime = new Date(row.target_timestamp);
    if (targetTime <= now) continue;
    
    forecast.push({
      timestamp: row.target_timestamp,
      hour: targetTime.getHours(),
      leadTimeHours: row.lead_time_hours ?? Math.round((targetTime - now) / (1000 * 60 * 60)),
      dmiTemp: row.dmi_temperature_2m_pred ?? null,
      mlTemp: row.ml_temp ?? null,
      effectiveTemp: row.ml_temp ?? row.dmi_temperature_2m_pred ?? null,
      effectiveTempSource: row.ml_temp ? "ml" : "dmi",
      apparentTemp: row.dmi_apparent_temperature_pred ?? row.dmi_temperature_2m_pred ?? null,
      dmiWindSpeed: row.dmi_windspeed_10m_pred ?? null,
      mlWindSpeed: row.ml_wind_speed ?? null,
      effectiveWindSpeed: row.ml_wind_speed ?? row.dmi_windspeed_10m_pred ?? null,
      effectiveWindSpeedSource: row.ml_wind_speed ? "ml" : "dmi",
      dmiWindGust: row.dmi_windgusts_10m_pred ?? null,
      mlWindGust: row.ml_wind_gust ?? null,
      effectiveWindGust: row.ml_wind_gust ?? row.dmi_windgusts_10m_pred ?? null,
      effectiveWindGustSource: row.ml_wind_gust ? "ml" : "dmi",
      windDirection: row.dmi_winddirection_10m_pred ?? null,
      dmiRainProb: row.dmi_precipitation_probability_pred ?? 0,
      mlRainProb: row.ml_rain_prob ? row.ml_rain_prob * 100 : 0,
      effectiveRainProb: row.ml_rain_prob ? row.ml_rain_prob * 100 : (row.dmi_precipitation_probability_pred ?? 0),
      effectiveRainProbSource: row.ml_rain_prob ? "ml" : "dmi",
      dmiRainAmount: row.dmi_precipitation_pred ?? 0,
      mlRainAmount: row.ml_rain_amount ?? 0,
      effectiveRainAmount: row.ml_rain_amount ?? row.dmi_precipitation_pred ?? 0,
      effectiveRainAmountSource: row.ml_rain_amount ? "ml" : "dmi",
      weatherCode: row.dmi_weathercode_pred ?? null,
      cloudCover: row.dmi_cloudcover_pred ?? null,
      humidity: row.dmi_relative_humidity_2m_pred ?? null,
      pressure: row.dmi_pressure_msl_pred ?? null,
    });
  }
  
  const result = forecast.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  console.log(`[Build] Built ${result.length} forecast entries`);
  return result;
}

function buildHistory(trainingRows) {
  const temperature = [];
  const wind = [];
  const rain = [];
  
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  
  console.log(`[Build] Processing ${trainingRows.length} training rows`);
  
  for (const row of trainingRows) {
    const targetTime = new Date(row.target_timestamp);
    if (targetTime < sevenDaysAgo || targetTime > now) continue;
    
    if (row.actual_temp != null) {
      temperature.push({
        timestamp: row.target_timestamp,
        dmiTemp: row.dmi_temperature_2m_pred ?? null,
        mlTemp: row.ml_temp ?? null,
        actualTemp: row.actual_temp ?? null,
        verified: row.actual_temp != null,
      });
    }
    
    if (row.actual_wind_speed != null) {
      wind.push({
        timestamp: row.target_timestamp,
        dmiWindSpeed: row.dmi_windspeed_10m_pred ?? null,
        mlWindSpeed: row.ml_wind_speed ?? null,
        actualWindSpeed: row.actual_wind_speed ?? null,
        dmiWindGust: row.dmi_windgusts_10m_pred ?? null,
        mlWindGust: row.ml_wind_gust ?? null,
        actualWindGust: row.actual_wind_gust ?? null,
        verified: row.actual_wind_speed != null,
      });
    }
    
    if (row.actual_precipitation != null) {
      rain.push({
        timestamp: row.target_timestamp,
        dmiRainProb: row.dmi_precipitation_probability_pred ?? 0,
        mlRainProb: row.ml_rain_prob ? row.ml_rain_prob * 100 : 0,
        actualRainEvent: row.actual_precipitation > 0.1 ? 1 : 0,
        dmiRainAmount: row.dmi_precipitation_pred ?? 0,
        mlRainAmount: row.ml_rain_amount ?? 0,
        actualRainAmount: row.actual_precipitation ?? null,
        verified: row.actual_precipitation != null,
      });
    }
  }
  
  console.log(`[Build] History: ${temperature.length} temp, ${wind.length} wind, ${rain.length} rain`);
  return { temperature, wind, rain };
}

function calculateMetrics(history) {
  const tempVerified = history.temperature.filter(p => p.verified && p.actualTemp != null);
  
  if (tempVerified.length > 0) {
    const dmiErrors = tempVerified.map(p => Math.abs(p.actualTemp - (p.dmiTemp ?? p.actualTemp)));
    const mlErrors = tempVerified.map(p => Math.abs(p.actualTemp - (p.mlTemp ?? p.dmiTemp ?? p.actualTemp)));
    
    const dmiMae = dmiErrors.reduce((a, b) => a + b, 0) / dmiErrors.length;
    const mlMae = mlErrors.reduce((a, b) => a + b, 0) / mlErrors.length;
    
    const dmiRmse = Math.sqrt(dmiErrors.map(e => e * e).reduce((a, b) => a + b, 0) / dmiErrors.length);
    const mlRmse = Math.sqrt(mlErrors.map(e => e * e).reduce((a, b) => a + b, 0) / mlErrors.length);
    
    return {
      target: "temperature",
      periodLabel: `Seneste 7 dage (${tempVerified.length} punkter)`,
      rmseDmi: dmiRmse,
      rmseMl: mlRmse,
      maeDmi: dmiMae,
      maeMl: mlMae,
      winRate: tempVerified.filter(p => {
        const dmiErr = Math.abs(p.actualTemp - (p.dmiTemp ?? p.actualTemp));
        const mlErr = Math.abs(p.actualTemp - (p.mlTemp ?? p.dmiTemp ?? p.actualTemp));
        return mlErr < dmiErr;
      }).length / tempVerified.length * 100,
      totalPredictions: tempVerified.length,
    };
  }
  
  return {
    target: "temperature",
    periodLabel: "Ingen verificeret historik endnu",
    rmseDmi: null,
    rmseMl: null,
    maeDmi: null,
    maeMl: null,
    winRate: null,
    totalPredictions: 0,
  };
}

function buildCurrentWeather(forecast) {
  if (!forecast || forecast.length === 0) return null;
  
  const current = forecast[0];
  return {
    timestamp: current.timestamp,
    temp: current.effectiveTemp,
    dmiTemp: current.dmiTemp,
    mlTemp: current.mlTemp,
    tempSource: current.effectiveTempSource,
    apparentTemp: current.apparentTemp,
    windSpeed: current.effectiveWindSpeed,
    dmiWindSpeed: current.dmiWindSpeed,
    mlWindSpeed: current.mlWindSpeed,
    windSpeedSource: current.effectiveWindSpeedSource,
    windGust: current.effectiveWindGust,
    dmiWindGust: current.dmiWindGust,
    mlWindGust: current.mlWindGust,
    windGustSource: current.effectiveWindGustSource,
    windDirection: current.windDirection,
    rainProb: current.effectiveRainProb,
    dmiRainProb: current.dmiRainProb,
    mlRainProb: current.mlRainProb,
    rainProbSource: current.effectiveRainProbSource,
    rainAmount: current.effectiveRainAmount,
    dmiRainAmount: current.dmiRainAmount,
    mlRainAmount: current.mlRainAmount,
    rainAmountSource: current.effectiveRainAmountSource,
    humidity: current.humidity,
    pressure: current.pressure,
    cloudCover: current.cloudCover,
    weatherCode: current.weatherCode,
  };
}

function checkMlActive(forecast, field) {
  return forecast.some(f => f[field] != null);
}

export default async function handler(req, res) {
  const now = Date.now();
  
  // Check cache
  if (cache.data && cache.expiresAt > now) {
    console.log("[Dashboard] Returning cached data");
    return res.status(200).json({
      snapshot: cache.data,
      stale: false,
      fetchedAt: cache.fetchedAt,
      source: "cache",
    });
  }
  
  try {
    console.log("[Dashboard] Starting data fetch from HF API...");
    
    // Fetch data from HF datasets-server API
    const [predictionsRows, trainingRows] = await Promise.all([
      fetchAllRowsFromHF(HF_DATASET_PREDICTIONS, "train").catch(e => {
        console.error("[Dashboard] Predictions fetch failed:", e.message);
        return [];
      }),
      fetchAllRowsFromHF(HF_DATASET_WEATHER, "train").catch(e => {
        console.error("[Dashboard] Training fetch failed:", e.message);
        return [];
      }),
    ]);
    
    console.log(`[Dashboard] Got ${predictionsRows.length} predictions, ${trainingRows.length} training rows`);
    
    // Build dashboard data
    const forecast = buildForecast(predictionsRows);
    const history = buildHistory(trainingRows);
    const current = buildCurrentWeather(forecast);
    const verification = calculateMetrics(history);
    
    const hasMlTemp = checkMlActive(forecast, "mlTemp");
    const hasMlWindSpeed = checkMlActive(forecast, "mlWindSpeed");
    const hasMlWindGust = checkMlActive(forecast, "mlWindGust");
    const hasMlRainProb = checkMlActive(forecast, "mlRainProb");
    const hasMlRainAmount = checkMlActive(forecast, "mlRainAmount");
    
    const data = {
      location: { name: "Aarhus", timezone: "Europe/Copenhagen" },
      generatedAt: new Date().toISOString(),
      targetLabels: {
        temperature: "Temperatur",
        wind_speed: "Vindhastighed",
        wind_gust: "Vindstød",
        rain_event: "Regnrisiko",
        rain_amount: "Regnmængde",
      },
      explanations: {
        forecast: "DMI's prognose vises sammen med vores ML-justering, når den er tilgængelig.",
        performance: "Se hvordan DMI og ML har klaret sig mod det faktiske vejr de seneste 7 dage.",
        sources: "DMI er grundprognosen. ML er vores lokale justering baseret på historiske data.",
      },
      targetStatus: {
        temperature: {
          hasActiveModel: hasMlTemp,
          activeBuckets: hasMlTemp ? ["1-6", "7-12", "13-24", "25-48"] : [],
          statusLabel: hasMlTemp ? "ML aktiv" : "DMI-prognose",
          statusDescription: hasMlTemp 
            ? "Vores ML-model justerer DMI's temperaturprognose."
            : "Viser DMI's prognose direkte. ML er under træning."
        },
        wind_speed: {
          hasActiveModel: hasMlWindSpeed,
          activeBuckets: hasMlWindSpeed ? ["1-6", "7-12", "13-24", "25-48"] : [],
          statusLabel: hasMlWindSpeed ? "ML aktiv" : "DMI-prognose",
          statusDescription: hasMlWindSpeed
            ? "Vores ML-model justerer vindhastighed."
            : "Viser DMI's vindprognose direkte. ML er under træning."
        },
        wind_gust: {
          hasActiveModel: hasMlWindGust,
          activeBuckets: hasMlWindGust ? ["1-6", "7-12", "13-24", "25-48"] : [],
          statusLabel: hasMlWindGust ? "ML aktiv" : "DMI-prognose",
          statusDescription: hasMlWindGust
            ? "Vores ML-model forudsiger vindstød."
            : "Viser DMI's vindstødsprognose direkte. ML er under træning."
        },
        rain_event: {
          hasActiveModel: hasMlRainProb,
          activeBuckets: hasMlRainProb ? ["1-6", "7-12", "13-24", "25-48"] : [],
          statusLabel: hasMlRainProb ? "ML aktiv" : "DMI-prognose",
          statusDescription: hasMlRainProb
            ? "Vores ML-model beregner regnsandsynlighed."
            : "Viser DMI's regnsandsynlighed direkte. ML er under træning."
        },
        rain_amount: {
          hasActiveModel: hasMlRainAmount,
          activeBuckets: hasMlRainAmount ? ["1-6", "7-12", "13-24", "25-48"] : [],
          statusLabel: hasMlRainAmount ? "ML aktiv" : "DMI-prognose",
          statusDescription: hasMlRainAmount
            ? "Vores ML-model estimerer regnmængde."
            : "Viser DMI's regnmængde direkte. ML er under træning."
        },
      },
      current,
      forecast,
      history,
      verification,
      leadBuckets: [],
      featureImportance: [],
      modelInfo: {
        trainedAt: null,
        trainingSamples: null,
        targets: ["temperature", "wind_speed", "wind_gust", "rain_event", "rain_amount"],
        registryGeneratedAt: null,
      },
      alerts: [],
    };
    
    // Cache the result
    cache = {
      data,
      fetchedAt: new Date().toISOString(),
      expiresAt: now + CACHE_TTL_MS,
    };
    
    console.log("[Dashboard] Data built successfully");
    
    return res.status(200).json({
      snapshot: data,
      stale: false,
      fetchedAt: cache.fetchedAt,
      source: "huggingface",
    });
  } catch (error) {
    console.error("[Dashboard] Fatal error:", error);
    
    return res.status(503).json({
      error: error instanceof Error ? error.message : "Failed to fetch data",
      details: "Check Vercel logs for more information",
    });
  }
}
