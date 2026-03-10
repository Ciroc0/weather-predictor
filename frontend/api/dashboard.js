// Vercel serverless function for weather dashboard
// Fetches HF datasets via REST API (JSON) instead of parsing parquet

const HF_DATASET_PREDICTIONS = "Ciroc0/dmi-aarhus-predictions";
const HF_DATASET_WEATHER = "Ciroc0/dmi-aarhus-weather-data";

// HF datasets-server API returns different column names than local parquet files
// HF API column names (verified from actual API response):
// - dmi_temp_pred, dmi_wind_pred, dmi_pressure_pred, dmi_humidity_pred
// - ml_pred (single prediction value)
// - timestamp, reference_time, lead_time_hours, verified, actual_temp

async function fetchDatasetRows(dataset, file) {
  const url = `https://datasets-server.huggingface.co/rows?` + 
    `dataset=${encodeURIComponent(dataset)}` +
    `&config=default&split=train&offset=0&length=100`;
  
  console.log(`[HF API] Fetching: ${url.substring(0, 120)}...`);
  
  const response = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HF API error: ${response.status} - ${error.substring(0, 200)}`);
  }
  
  const data = await response.json();
  console.log(`[HF API] Got ${data.rows?.length || 0} rows for ${dataset}`);
  
  // Log first row structure for debugging
  if (data.rows && data.rows.length > 0) {
    const firstRow = data.rows[0].row;
    console.log(`[HF API] First row keys: ${Object.keys(firstRow).join(', ')}`);
  }
  
  return data.rows?.map(r => r.row) || [];
}

export default async function handler(req, res) {
  // Set CORS and cache headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log("[Dashboard] Starting data fetch from HF datasets-server API...");
    
    // Fetch predictions and weather data in parallel
    const [predRows, weatherRows] = await Promise.all([
      fetchDatasetRows(HF_DATASET_PREDICTIONS, "predictions_latest.parquet"),
      fetchDatasetRows(HF_DATASET_WEATHER, "training_matrix.parquet"),
    ]);
    
    console.log(`[Dashboard] Fetched ${predRows.length} predictions, ${weatherRows.length} weather rows`);
    
    // Log sample data structure
    if (predRows.length > 0) {
      const sample = predRows[0];
      console.log(`[Dashboard] Sample prediction row:`, {
        timestamp: sample.timestamp,
        dmi_temp: sample.dmi_temp_pred,
        ml_pred: sample.ml_pred,
        lead_time: sample.lead_time_hours,
        verified: sample.verified
      });
    }
    
    // Sort predictions by timestamp
    const sortedPreds = predRows.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Get latest reference time for forecasts (future predictions)
    const now = new Date();
    const referenceTimes = [...new Set(sortedPreds.map(p => p.reference_time))].sort();
    const latestRefTime = referenceTimes[referenceTimes.length - 1];
    
    console.log(`[Dashboard] Latest reference time: ${latestRefTime}`);
    
    // Build forecast array (next 48 hours from latest prediction)
    const forecast = [];
    const futurePreds = sortedPreds.filter(p => 
      p.reference_time === latestRefTime && new Date(p.timestamp) >= now
    ).slice(0, 48);
    
    for (const p of futurePreds) {
      // Use ml_pred if available, otherwise fall back to dmi
      const hasMl = p.ml_pred != null && !isNaN(p.ml_pred);
      
      forecast.push({
        hour: p.timestamp,
        leadTimeHours: p.lead_time_hours,
        // Temperature
        dmiTemp: p.dmi_temp_pred ?? null,
        mlTemp: hasMl ? p.ml_pred : null,
        effectiveTemp: hasMl ? p.ml_pred : (p.dmi_temp_pred ?? null),
        effectiveTempSource: hasMl ? "ml" : "dmi",
        apparentTemp: null, // Not available in HF API
        // Wind speed
        dmiWindSpeed: p.dmi_wind_pred ?? null,
        mlWindSpeed: null, // Not separate in HF API
        effectiveWindSpeed: p.dmi_wind_pred ?? null,
        effectiveWindSpeedSource: "dmi",
        // Wind gust - not available in HF API
        dmiWindGust: null,
        mlWindGust: null,
        effectiveWindGust: null,
        effectiveWindGustSource: "dmi",
        windDirection: null,
        // Rain - not available in HF API structure
        dmiRainProb: 0,
        mlRainProb: 0,
        effectiveRainProb: 0,
        effectiveRainProbSource: "dmi",
        dmiRainAmount: 0,
        mlRainAmount: 0,
        effectiveRainAmount: 0,
        effectiveRainAmountSource: "dmi",
        // Other
        weatherCode: null,
        cloudCover: null,
        humidity: p.dmi_humidity_pred ?? null,
        pressure: p.dmi_pressure_pred ?? null,
      });
    }
    
    // Build current weather from most recent row (regardless of reference time)
    const latestRow = sortedPreds.filter(p => new Date(p.timestamp) <= now).pop() || sortedPreds[0];
    const hasCurrentMl = latestRow.ml_pred != null && !isNaN(latestRow.ml_pred);
    
    const current = {
      temp: hasCurrentMl ? latestRow.ml_pred : (latestRow.dmi_temp_pred ?? null),
      dmiTemp: latestRow.dmi_temp_pred ?? null,
      mlTemp: hasCurrentMl ? latestRow.ml_pred : null,
      tempSource: hasCurrentMl ? "ml" : "dmi",
      apparentTemp: null,
      windSpeed: latestRow.dmi_wind_pred ?? null,
      dmiWindSpeed: latestRow.dmi_wind_pred ?? null,
      mlWindSpeed: null,
      windSpeedSource: "dmi",
      windGust: null,
      dmiWindGust: null,
      mlWindGust: null,
      windGustSource: "dmi",
      windDirection: null,
      rainProb: 0,
      dmiRainProb: 0,
      mlRainProb: 0,
      rainProbSource: "dmi",
      rainAmount: 0,
      dmiRainAmount: 0,
      mlRainAmount: 0,
      rainAmountSource: "dmi",
      humidity: latestRow.dmi_humidity_pred ?? null,
      pressure: latestRow.dmi_pressure_pred ?? null,
      cloudCover: null,
      weatherCode: null,
    };
    
    // Build history from verified rows (last 7 days)
    const verifiedRows = sortedPreds.filter(p => p.verified === true || p.verified === "true");
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentVerified = verifiedRows.filter(p => new Date(p.timestamp) >= sevenDaysAgo);
    
    console.log(`[Dashboard] Found ${recentVerified.length} verified rows in last 7 days`);
    
    const history = {
      temperature: [],
      wind: [],
      rain: [],
    };
    
    // Calculate metrics from verified data
    let tempErrorsDmi = [];
    let tempErrorsMl = [];
    
    for (const p of recentVerified) {
      const actual = p.actual_temp;
      if (actual == null || isNaN(actual)) continue;
      
      const dmi = p.dmi_temp_pred;
      const ml = p.ml_pred;
      
      if (dmi != null && !isNaN(dmi)) {
        tempErrorsDmi.push({ actual, predicted: dmi, error: Math.abs(actual - dmi) });
      }
      if (ml != null && !isNaN(ml)) {
        tempErrorsMl.push({ actual, predicted: ml, error: Math.abs(actual - ml) });
      }
      
      history.temperature.push({
        timestamp: p.timestamp,
        actual: actual,
        dmi: dmi ?? null,
        ml: ml ?? null,
        leadTimeHours: p.lead_time_hours ?? null,
      });
    }
    
    // Calculate verification metrics
    const rmse = (errors) => errors.length > 0 
      ? Math.sqrt(errors.reduce((sum, e) => sum + (e.actual - e.predicted) ** 2, 0) / errors.length)
      : null;
    
    const mae = (errors) => errors.length > 0
      ? errors.reduce((sum, e) => sum + e.error, 0) / errors.length
      : null;
    
    // Calculate win rate (ML beats DMI)
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
    
    console.log(`[Dashboard] Metrics - DMI RMSE: ${verification.rmseDmi?.toFixed(2) || 'N/A'}, ML RMSE: ${verification.rmseMl?.toFixed(2) || 'N/A'}, Win rate: ${verification.winRate?.toFixed(1) || 'N/A'}%`);
    
    // Build target status
    const targetStatus = {
      temperature: {
        hasActiveModel: true,
        activeBuckets: ["1-6", "7-12", "13-24", "25-48"],
        statusLabel: "ML aktiv",
        statusDescription: "Vores ML-model justerer DMI's temperaturprognose.",
      },
      wind_speed: {
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's vindprognose direkte. ML er under træning.",
      },
      wind_gust: {
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's vindstødsprognose direkte. ML er under træning.",
      },
      rain_event: {
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's regnprognose direkte. ML er under træning.",
      },
      rain_amount: {
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's regnmængde direkte. ML er under træning.",
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
      leadBuckets: ["1-6", "7-12", "13-24", "25-48", "49-72", "73-96", "97-120"],
      featureImportance: [],
      modelInfo: {
        trainedAt: null,
        trainingSamples: null,
        targets: ["temperature", "wind_speed", "wind_gust", "rain_event", "rain_amount"],
        registryGeneratedAt: null,
      },
      alerts: [],
    };
    
    console.log("[Dashboard] Successfully built snapshot with:", {
      forecastHours: forecast.length,
      currentTemp: current.temp,
      verifiedCount: recentVerified.length,
    });
    
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
