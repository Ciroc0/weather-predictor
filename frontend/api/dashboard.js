// Call HF Space API directly instead of parsing datasets
const HF_SPACE_API = "https://ciroc0-dmi-vs-ml-dashboard.hf.space";
const HF_TOKEN = process.env.HF_TOKEN;
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = {
  expiresAt: 0,
  data: null,
  fetchedAt: null,
};

async function fetchFromHFSpace() {
  // HF Spaces med Gradio har et API på /api/predict
  // Men vi kan også scrape data fra space'et eller kalde det direkte
  
  // Prøv at kalde space'ets API
  const url = `${HF_SPACE_API}/api/predict`;
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (HF_TOKEN) {
    headers.Authorization = `Bearer ${HF_TOKEN}`;
  }
  
  console.log(`[HF Space] Calling: ${url}`);
  
  // Gradio API kræver en specifik payload
  // Vi prøver at kalde refresh_dashboard funktionen
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fn_index: 0,  // refresh_dashboard er typisk første funktion
      data: [false], // force=false
    }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`[HF Space] Error ${response.status}:`, text.substring(0, 500));
    throw new Error(`HF Space API error: ${response.status}`);
  }
  
  const result = await response.json();
  console.log(`[HF Space] Got response:`, Object.keys(result));
  
  return result;
}

// Alternativ: Hent parquet filer direkte fra HF og parse med en simpel parser
async function fetchParquetDirect() {
  console.log("[Direct] Fetching parquet files directly from HF...");
  
  // HF tillader direkte download af filer
  const predictionsUrl = "https://huggingface.co/datasets/Ciroc0/dmi-aarhus-predictions/resolve/main/predictions_latest.parquet";
  const trainingUrl = "https://huggingface.co/datasets/Ciroc0/dmi-aarhus-weather-data/resolve/main/training_matrix.parquet";
  
  const headers = {};
  if (HF_TOKEN) {
    headers.Authorization = `Bearer ${HF_TOKEN}`;
  }
  
  console.log(`[Direct] Fetching predictions from: ${predictionsUrl}`);
  
  // Fetch med redirect
  const predResponse = await fetch(predictionsUrl, { 
    headers,
    redirect: "follow",
  });
  
  if (!predResponse.ok) {
    console.error(`[Direct] Predictions fetch failed: ${predResponse.status}`);
    throw new Error(`Failed to fetch predictions: ${predResponse.status}`);
  }
  
  console.log(`[Direct] Got predictions: ${predResponse.headers.get('content-length')} bytes`);
  
  // Læs som buffer
  const predBuffer = await predResponse.arrayBuffer();
  console.log(`[Direct] Predictions buffer: ${predBuffer.byteLength} bytes`);
  
  // Returnér rå data til debugging
  return {
    predictionsSize: predBuffer.byteLength,
    predictionsBuffer: Buffer.from(predBuffer).toString('base64').substring(0, 100),
  };
}

// Fallback: Generer mock data baseret på hvad vi ved om strukturen
function generateMockData() {
  console.log("[Mock] Generating fallback data");
  
  const now = new Date();
  const forecast = [];
  
  // Generer 48 timer forecast
  for (let i = 0; i < 48; i++) {
    const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
    forecast.push({
      timestamp: hour.toISOString(),
      hour: hour.getHours(),
      leadTimeHours: i,
      dmiTemp: 5 + Math.sin(i / 12) * 3,
      mlTemp: null, // ML ikke aktiv endnu
      effectiveTemp: 5 + Math.sin(i / 12) * 3,
      effectiveTempSource: "dmi",
      apparentTemp: 3 + Math.sin(i / 12) * 3,
      dmiWindSpeed: 5 + Math.random() * 10,
      mlWindSpeed: null,
      effectiveWindSpeed: 5 + Math.random() * 10,
      effectiveWindSpeedSource: "dmi",
      dmiWindGust: 10 + Math.random() * 15,
      mlWindGust: null,
      effectiveWindGust: 10 + Math.random() * 15,
      effectiveWindGustSource: "dmi",
      windDirection: 180 + Math.random() * 180,
      dmiRainProb: Math.random() * 30,
      mlRainProb: 0,
      effectiveRainProb: Math.random() * 30,
      effectiveRainProbSource: "dmi",
      dmiRainAmount: Math.random() * 2,
      mlRainAmount: 0,
      effectiveRainAmount: Math.random() * 2,
      effectiveRainAmountSource: "dmi",
      weatherCode: Math.random() > 0.7 ? 3 : 0,
      cloudCover: Math.random() * 100,
      humidity: 80 + Math.random() * 20,
      pressure: 1013 + Math.random() * 10,
    });
  }
  
  const current = forecast[0];
  
  return {
    location: {
      name: "Aarhus",
      timezone: "Europe/Copenhagen",
    },
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
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's temperaturprognose direkte. ML-model er under træning."
      },
      wind_speed: {
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's vindprognose direkte. ML-model er under træning."
      },
      wind_gust: {
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's vindstødsprognose direkte. ML-model er under træning."
      },
      rain_event: {
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's regnsandsynlighed direkte. ML-model er under træning."
      },
      rain_amount: {
        hasActiveModel: false,
        activeBuckets: [],
        statusLabel: "DMI-prognose",
        statusDescription: "Viser DMI's regnmængde direkte. ML-model er under træning."
      },
    },
    current: {
      timestamp: current.timestamp,
      temp: current.effectiveTemp,
      dmiTemp: current.dmiTemp,
      mlTemp: current.mlTemp,
      tempSource: "dmi",
      apparentTemp: current.apparentTemp,
      windSpeed: current.effectiveWindSpeed,
      dmiWindSpeed: current.dmiWindSpeed,
      mlWindSpeed: current.mlWindSpeed,
      windSpeedSource: "dmi",
      windGust: current.effectiveWindGust,
      dmiWindGust: current.dmiWindGust,
      mlWindGust: current.mlWindGust,
      windGustSource: "dmi",
      windDirection: current.windDirection,
      rainProb: current.effectiveRainProb,
      dmiRainProb: current.dmiRainProb,
      mlRainProb: current.mlRainProb,
      rainProbSource: "dmi",
      rainAmount: current.effectiveRainAmount,
      dmiRainAmount: current.dmiRainAmount,
      mlRainAmount: current.mlRainAmount,
      rainAmountSource: "dmi",
      humidity: current.humidity,
      pressure: current.pressure,
      cloudCover: current.cloudCover,
      weatherCode: current.weatherCode,
    },
    forecast,
    history: {
      temperature: [],
      wind: [],
      rain: [],
    },
    verification: {
      target: "temperature",
      periodLabel: "Ingen verificeret historik endnu",
      rmseDmi: null,
      rmseMl: null,
      maeDmi: null,
      maeMl: null,
      winRate: null,
      totalPredictions: 0,
    },
    leadBuckets: [],
    featureImportance: [],
    modelInfo: {
      trainedAt: null,
      trainingSamples: null,
      targets: ["temperature", "wind_speed", "wind_gust", "rain_event", "rain_amount"],
      registryGeneratedAt: null,
    },
    alerts: [{
      type: "info",
      severity: "info",
      title: "ML-modeller under udvikling",
      message: "Vi træner stadig ML-modellerne. Indtil videre vises DMI's prognoser direkte.",
    }],
  };
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
    // Prøv at hente fra HF Space
    console.log("[Dashboard] Attempting to fetch from HF Space...");
    let data;
    
    try {
      const spaceResult = await fetchFromHFSpace();
      // Hvis vi fik data fra space, konverter det
      // TODO: Parse space result
      console.log("[Dashboard] Space data received (not implemented yet)");
      throw new Error("Space parsing not implemented");
    } catch (spaceError) {
      console.log(`[Dashboard] Space fetch failed: ${spaceError.message}`);
      
      // Prøv at hente parquet direkte
      try {
        const parquetInfo = await fetchParquetDirect();
        console.log("[Dashboard] Parquet info:", parquetInfo);
        
        // Vi har filerne men kan ikke parse dem uden en parquet parser
        // Brug mock data indtil videre
        data = generateMockData();
        data._debug = {
          parquetSize: parquetInfo.predictionsSize,
          message: "Parquet files fetched but parsing not implemented",
        };
      } catch (parquetError) {
        console.log(`[Dashboard] Parquet fetch failed: ${parquetError.message}`);
        
        // Fallback til mock data
        data = generateMockData();
        data._debug = {
          error: "All fetch methods failed",
          spaceError: spaceError.message,
          parquetError: parquetError.message,
        };
      }
    }
    
    // Cache resultatet
    cache = {
      data,
      fetchedAt: new Date().toISOString(),
      expiresAt: now + CACHE_TTL_MS,
    };
    
    return res.status(200).json({
      snapshot: data,
      stale: false,
      fetchedAt: cache.fetchedAt,
      source: "mock", // Ændres når rigtig data er tilgængelig
    });
  } catch (error) {
    console.error("[Dashboard] Fatal error:", error);
    
    // Returnér mock data ved fejl
    const mockData = generateMockData();
    
    return res.status(200).json({
      snapshot: mockData,
      stale: true,
      fetchedAt: new Date().toISOString(),
      source: "mock-error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
