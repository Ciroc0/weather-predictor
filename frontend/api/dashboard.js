// Vercel serverless function for weather dashboard
// Fetches HF datasets by downloading parquet files directly

const HF_DATASET_PREDICTIONS = "Ciroc0/dmi-aarhus-predictions";
const HF_DATASET_WEATHER = "Ciroc0/dmi-aarhus-weather-data";

// Direct file download URLs from HF
// Format: https://huggingface.co/datasets/{owner}/{repo}/resolve/main/{file}
const HF_PREDICTIONS_URL = `https://huggingface.co/datasets/${HF_DATASET_PREDICTIONS}/resolve/main/predictions_latest.parquet`;
const HF_WEATHER_URL = `https://huggingface.co/datasets/${HF_DATASET_WEATHER}/resolve/main/training_matrix.parquet`;

// Simple parquet parser for browser/Node.js
// Reads parquet file and returns array of row objects
async function parseParquet(arrayBuffer) {
  // For now, return mock data structure that matches what we need
  // In production, we'd use a proper parquet library
  // But since we can't easily parse parquet in Vercel, let's use a different approach:
  // We'll fetch from HF's datasets-server but map the columns correctly
  
  // Actually, let's fetch the raw bytes and try to extract what we can
  const bytes = new Uint8Array(arrayBuffer);
  
  // Check if it's a valid parquet file (magic bytes 'PAR1')
  if (bytes[0] !== 0x50 || bytes[1] !== 0x41 || bytes[2] !== 0x52 || bytes[3] !== 0x31) {
    throw new Error("Invalid parquet file");
  }
  
  // For now, return empty and fall back to API
  return null;
}

// Fetch from HF datasets-server API (JSON format)
async function fetchFromHFAPI(dataset, limit = 100) {
  const url = `https://datasets-server.huggingface.co/rows?` + 
    `dataset=${encodeURIComponent(dataset)}` +
    `&config=default&split=train&offset=0&length=${limit}`;
  
  console.log(`[HF API] Fetching: ${dataset}`);
  
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HF API error: ${response.status} - ${error.substring(0, 200)}`);
  }
  
  const data = await response.json();
  const rows = data.rows?.map(r => r.row) || [];
  
  console.log(`[HF API] Got ${rows.length} rows from ${dataset}`);
  
  return rows;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log("[Dashboard] Fetching weather data...");
    
    // Fetch both datasets in parallel from HF API
    const [predRows, weatherRows] = await Promise.all([
      fetchFromHFAPI(HF_DATASET_PREDICTIONS, 100),
      fetchFromHFAPI(HF_DATASET_WEATHER, 100),
    ]);
    
    console.log(`[Dashboard] Fetched ${predRows.length} predictions, ${weatherRows.length} weather rows`);
    
    if (predRows.length === 0) {
      throw new Error("No prediction data available");
    }
    
    // Log available columns for debugging
    if (predRows.length > 0) {
      console.log("[Dashboard] Available columns:", Object.keys(predRows[0]).join(", "));
    }
    
    // Sort predictions by timestamp
    const sortedPreds = predRows.sort((a, b) => 
      new Date(a.timestamp || a.target_timestamp) - new Date(b.timestamp || b.target_timestamp)
    );
    
    const now = new Date();
    
    // Get unique reference times
    const referenceTimes = [...new Set(sortedPreds.map(p => p.reference_time))].sort();
    const latestRefTime = referenceTimes[referenceTimes.length - 1];
    
    console.log(`[Dashboard] Latest reference time: ${latestRefTime}`);
    
    // Build forecast from latest reference time
    const forecast = [];
    const latestPreds = sortedPreds.filter(p => p.reference_time === latestRefTime);
    const futurePreds = latestPreds.filter(p => new Date(p.timestamp || p.target_timestamp) >= now);
    const predsToUse = futurePreds.length > 0 ? futurePreds : latestPreds;
    const selectedPreds = predsToUse.slice(0, 48);
    
    for (const p of selectedPreds) {
      const ts = p.timestamp || p.target_timestamp;
      
      // Check for ML values - try different column names
      const mlTemp = p.ml_temp ?? p.ml_pred ?? null;
      const mlWindSpeed = p.ml_wind_speed ?? null;
      const mlWindGust = p.ml_wind_gust ?? null;
      const mlRainProb = p.ml_rain_prob ?? null;
      const mlRainAmount = p.ml_rain_amount ?? null;
      
      const hasMlTemp = mlTemp !== null && !isNaN(mlTemp);
      const hasMlWind = mlWindSpeed !== null && !isNaN(mlWindSpeed);
      const hasMlRain = mlRainProb !== null && !isNaN(mlRainProb);
      
      // Get DMI values - try different column names
      const dmiTemp = p.dmi_temperature_2m_pred ?? p.dmi_temp_pred ?? null;
      const dmiWindSpeed = p.dmi_windspeed_10m_pred ?? p.dmi_wind_pred ?? null;
      const dmiWindGust = p.dmi_windgusts_10m_pred ?? null;
      const dmiRainProb = p.dmi_precipitation_probability_pred ?? null;
      const dmiRainAmount = p.dmi_precipitation_pred ?? p.dmi_rain_pred ?? 0;
      
      forecast.push({
        hour: ts,
        timestamp: ts,
        leadTimeHours: p.lead_time_hours,
        // Temperature
        dmiTemp: dmiTemp,
        mlTemp: hasMlTemp ? mlTemp : null,
        effectiveTemp: hasMlTemp ? mlTemp : dmiTemp,
        effectiveTempSource: hasMlTemp ? "ml" : "dmi",
        apparentTemp: p.dmi_apparent_temperature_pred ?? null,
        // Wind speed
        dmiWindSpeed: dmiWindSpeed,
        mlWindSpeed: hasMlWind ? mlWindSpeed : null,
        effectiveWindSpeed: hasMlWind ? mlWindSpeed : dmiWindSpeed,
        effectiveWindSpeedSource: hasMlWind ? "ml" : "dmi",
        // Wind gust
        dmiWindGust: dmiWindGust,
        mlWindGust: mlWindGust,
        effectiveWindGust: mlWindGust ?? dmiWindGust,
        effectiveWindGustSource: mlWindGust ? "ml" : "dmi",
        windDirection: p.dmi_winddirection_10m_pred ?? null,
        // Rain
        dmiRainProb: dmiRainProb ?? 0,
        mlRainProb: hasMlRain ? mlRainProb : 0,
        effectiveRainProb: hasMlRain ? mlRainProb : (dmiRainProb ?? 0),
        effectiveRainProbSource: hasMlRain ? "ml" : "dmi",
        dmiRainAmount: dmiRainAmount,
        mlRainAmount: mlRainAmount ?? 0,
        effectiveRainAmount: mlRainAmount ?? dmiRainAmount,
        effectiveRainAmountSource: mlRainAmount ? "ml" : "dmi",
        // Other
        weatherCode: p.dmi_weather_code_pred ?? null,
        cloudCover: p.dmi_cloud_cover_pred ?? null,
        humidity: p.dmi_relative_humidity_2m_pred ?? p.dmi_humidity_pred ?? null,
        pressure: p.dmi_pressure_msl_pred ?? p.dmi_pressure_pred ?? null,
      });
    }
    
    // Build current weather
    const latestRow = sortedPreds.filter(p => new Date(p.timestamp || p.target_timestamp) <= now).pop() || sortedPreds[0];
    
    const currentMlTemp = latestRow.ml_temp ?? latestRow.ml_pred ?? null;
    const hasCurrentMl = currentMlTemp !== null && !isNaN(currentMlTemp);
    const currentDmiTemp = latestRow.dmi_temperature_2m_pred ?? latestRow.dmi_temp_pred ?? null;
    
    const current = {
      temp: hasCurrentMl ? currentMlTemp : currentDmiTemp,
      dmiTemp: currentDmiTemp,
      mlTemp: hasCurrentMl ? currentMlTemp : null,
      tempSource: hasCurrentMl ? "ml" : "dmi",
      apparentTemp: latestRow.dmi_apparent_temperature_pred ?? null,
      windSpeed: latestRow.dmi_windspeed_10m_pred ?? latestRow.dmi_wind_pred ?? null,
      dmiWindSpeed: latestRow.dmi_windspeed_10m_pred ?? latestRow.dmi_wind_pred ?? null,
      mlWindSpeed: latestRow.ml_wind_speed ?? null,
      windSpeedSource: latestRow.ml_wind_speed ? "ml" : "dmi",
      windGust: latestRow.dmi_windgusts_10m_pred ?? null,
      dmiWindGust: latestRow.dmi_windgusts_10m_pred ?? null,
      mlWindGust: latestRow.ml_wind_gust ?? null,
      windGustSource: latestRow.ml_wind_gust ? "ml" : "dmi",
      windDirection: latestRow.dmi_winddirection_10m_pred ?? null,
      rainProb: latestRow.ml_rain_prob ?? latestRow.dmi_precipitation_probability_pred ?? 0,
      dmiRainProb: latestRow.dmi_precipitation_probability_pred ?? 0,
      mlRainProb: latestRow.ml_rain_prob ?? 0,
      rainProbSource: latestRow.ml_rain_prob ? "ml" : "dmi",
      rainAmount: latestRow.ml_rain_amount ?? latestRow.dmi_precipitation_pred ?? 0,
      dmiRainAmount: latestRow.dmi_precipitation_pred ?? 0,
      mlRainAmount: latestRow.ml_rain_amount ?? 0,
      rainAmountSource: latestRow.ml_rain_amount ? "ml" : "dmi",
      humidity: latestRow.dmi_relative_humidity_2m_pred ?? latestRow.dmi_humidity_pred ?? null,
      pressure: latestRow.dmi_pressure_msl_pred ?? latestRow.dmi_pressure_pred ?? null,
      cloudCover: latestRow.dmi_cloud_cover_pred ?? null,
      weatherCode: latestRow.dmi_weather_code_pred ?? null,
    };
    
    // Build history from verified rows
    const verifiedRows = sortedPreds.filter(p => p.verified === true || p.verified === "true");
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentVerified = verifiedRows.filter(p => new Date(p.timestamp || p.target_timestamp) >= sevenDaysAgo);
    
    const history = {
      temperature: recentVerified.map(p => ({
        timestamp: p.timestamp || p.target_timestamp,
        actual: p.actual_temp,
        dmiTemp: p.dmi_temperature_2m_pred ?? p.dmi_temp_pred,
        mlTemp: p.ml_temp ?? p.ml_pred,
        verified: true,
      })),
      wind: recentVerified.map(p => ({
        timestamp: p.timestamp || p.target_timestamp,
        actualWindSpeed: p.actual_wind_speed,
        dmiWindSpeed: p.dmi_windspeed_10m_pred ?? p.dmi_wind_pred,
        mlWindSpeed: p.ml_wind_speed,
        actualWindGust: p.actual_wind_gust,
        dmiWindGust: p.dmi_windgusts_10m_pred,
        mlWindGust: p.ml_wind_gust,
        verified: true,
      })),
      rain: recentVerified.map(p => ({
        timestamp: p.timestamp || p.target_timestamp,
        actualRainEvent: p.actual_rain_event,
        dmiRainProb: p.dmi_precipitation_probability_pred,
        mlRainProb: p.ml_rain_prob,
        actualRainAmount: p.actual_rain_amount,
        dmiRainAmount: p.dmi_precipitation_pred,
        mlRainAmount: p.ml_rain_amount,
        verified: true,
      })),
    };
    
    // Calculate verification metrics
    const tempErrorsDmi = [];
    const tempErrorsMl = [];
    
    for (const p of recentVerified) {
      const actual = p.actual_temp;
      if (actual == null || isNaN(actual)) continue;
      
      const dmi = p.dmi_temperature_2m_pred ?? p.dmi_temp_pred;
      const ml = p.ml_temp ?? p.ml_pred;
      
      if (dmi != null && !isNaN(dmi)) {
        tempErrorsDmi.push({ actual, predicted: dmi, error: Math.abs(actual - dmi) });
      }
      if (ml != null && !isNaN(ml)) {
        tempErrorsMl.push({ actual, predicted: ml, error: Math.abs(actual - ml) });
      }
    }
    
    const rmse = (errors) => errors.length > 0 
      ? Math.sqrt(errors.reduce((sum, e) => sum + (e.actual - e.predicted) ** 2, 0) / errors.length)
      : null;
    
    const mae = (errors) => errors.length > 0
      ? errors.reduce((sum, e) => sum + e.error, 0) / errors.length
      : null;
    
    let mlWins = 0;
    let totalComparisons = 0;
    for (let i = 0; i < Math.min(tempErrorsDmi.length, tempErrorsMl.length); i++) {
      totalComparisons++;
      if (tempErrorsMl[i].error < tempErrorsDmi[i].error) mlWins++;
    }
    
    const verification = {
      target: "temperature",
      periodLabel: recentVerified.length > 0 
        ? `Seneste 7 dage (${recentVerified.length} sammenligninger)`
        : "Ingen verificeret historik endnu",
      rmseDmi: rmse(tempErrorsDmi),
      rmseMl: rmse(tempErrorsMl),
      maeDmi: mae(tempErrorsDmi),
      maeMl: mae(tempErrorsMl),
      winRate: totalComparisons > 0 ? (mlWins / totalComparisons) * 100 : null,
      totalPredictions: totalComparisons,
    };
    
    // Target status based on what's available
    const hasMlTemp = forecast.some(p => p.mlTemp !== null);
    const hasMlWind = forecast.some(p => p.mlWindSpeed !== null);
    const hasMlGust = forecast.some(p => p.mlWindGust !== null);
    const hasMlRain = forecast.some(p => p.mlRainProb !== null && p.mlRainProb > 0);
    const hasMlRainAmount = forecast.some(p => p.mlRainAmount !== null && p.mlRainAmount > 0);
    
    const targetStatus = {
      temperature: {
        hasActiveModel: hasMlTemp,
        activeBuckets: hasMlTemp ? ["1-6", "7-12", "13-24", "25-48"] : [],
        statusLabel: hasMlTemp ? "ML aktiv" : "DMI-prognose",
        statusDescription: hasMlTemp 
          ? "Vores ML-model justerer DMI's temperaturprognose."
          : "Viser DMI's prognose direkte. ML er under træning.",
      },
      wind_speed: {
        hasActiveModel: hasMlWind,
        activeBuckets: hasMlWind ? ["1-6", "7-12", "13-24", "25-48"] : [],
        statusLabel: hasMlWind ? "ML aktiv" : "DMI-prognose",
        statusDescription: hasMlWind 
          ? "Vores ML-model justerer DMI's vindprognose."
          : "Viser DMI's vindprognose direkte. ML er under træning.",
      },
      wind_gust: {
        hasActiveModel: hasMlGust,
        activeBuckets: hasMlGust ? ["1-6", "7-12", "13-24", "25-48"] : [],
        statusLabel: hasMlGust ? "ML aktiv" : "DMI-prognose",
        statusDescription: hasMlGust 
          ? "Vores ML-model justerer DMI's vindstødsprognose."
          : "Viser DMI's vindstødsprognose direkte. ML er under træning.",
      },
      rain_event: {
        hasActiveModel: hasMlRain,
        activeBuckets: hasMlRain ? ["1-6", "7-12", "13-24", "25-48"] : [],
        statusLabel: hasMlRain ? "ML aktiv" : "DMI-prognose",
        statusDescription: hasMlRain 
          ? "Vores ML-model beregner regnsandsynlighed."
          : "Viser DMI's regnprognose direkte. ML er under træning.",
      },
      rain_amount: {
        hasActiveModel: hasMlRainAmount,
        activeBuckets: hasMlRainAmount ? ["1-6", "7-12", "13-24", "25-48"] : [],
        statusLabel: hasMlRainAmount ? "ML aktiv" : "DMI-prognose",
        statusDescription: hasMlRainAmount 
          ? "Vores ML-model estimerer regnmængde."
          : "Viser DMI's regnmængde direkte. ML er under træning.",
      },
    };
    
    const snapshot = {
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
      targetStatus,
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
    
    console.log("[Dashboard] Success - forecast:", forecast.length, "hours");
    console.log("[Dashboard] ML available - temp:", hasMlTemp, "wind:", hasMlWind, "rain:", hasMlRain);
    
    return res.status(200).json({
      snapshot,
      stale: false,
      fetchedAt: new Date().toISOString(),
      source: "hf-api",
    });
    
  } catch (error) {
    console.error("[Dashboard] Error:", error);
    return res.status(500).json({
      error: error.message,
      snapshot: null,
      stale: true,
      fetchedAt: new Date().toISOString(),
    });
  }
}
