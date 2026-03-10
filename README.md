# Weather Predictor - Aarhus Vejrprognose

Et ML-drevet vejrprognose-system specifikt designet til Aarhus, Danmark. Systemet kombinerer DMI's HARMONIE forecast-modeller med maskinlæringskorrektioner for at forbedre nøjagtigheden af temperatur-, vind- og regnprognoser.

## Arkitektur

Systemet består af tre Hugging Face Spaces og to Datasets, der arbejder sammen i en pipeline:

```
┌─────────────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│  dmi-collector      │────▶│  dmi-aarhus-weather-data │◀────│  dmi-ml-trainer     │
│  (Data & Predict)   │     │  (Training & Models)     │     │  (Model Training)   │
└─────────────────────┘     └──────────────────────────┘     └─────────────────────┘
           │                                                        │
           │                                                Træner modeller
           │                                                hver søndag
           ▼
┌─────────────────────┐     ┌──────────────────────────┐
│  dmi-vs-ml-dashboard│◀────│  dmi-aarhus-predictions  │
│  (Visualisering)    │     │  (Live Predictions)      │
└─────────────────────┘     └──────────────────────────┘
```

## Komponenter

### 1. dmi-collector (Hugging Face Space)
**Ansvar:** Dataopsamling, predictionsgenerering og verificering

**Scheduler:**
| Interval | Handling | Beskrivelse |
|----------|----------|-------------|
| Hver 3. time | `generate_predictions()` | Genererer nye 48-timers ML-forudsigelser for alle targets |
| Hver time | `verify_predictions()` | Verificerer gamle predictions mod faktiske observationer |
| Dagligt kl. 06:00 | `update_daily()` | Henter forecast og observationsdata for de sidste 7 dage |

**Hovedfunktioner:**
- Henter DMI HARMONIE forecast-data fra Open-Meteo API
- Henter historiske observationer fra Open-Meteo Archive
- Bygger træningsmatricer med features
- Genererer 48-timers fremadrettede predictions
- Verificerer predictions mod faktisk vejr
- Publicerer frontend snapshot JSON

**Targets:**
- Temperatur (korrektionsmodel)
- Vindhastighed (korrektionsmodel)
- Vindstød (korrektionsmodel)
- Regnhændelse (klassifikation)
- Regnmængde (regression, kun våde timer)

### 2. dmi-ml-trainer (Hugging Face Space)
**Ansvar:** Træning og deployment af ML-modeller

**Scheduler:**
| Interval | Handling | Beskrivelse |
|----------|----------|-------------|
| Hver søndag kl. 06:30 | `auto_retrain()` | Automatisk retraining af alle target-modeller |

**Modelstrategi:**
- XGBoost-baserede modeller
- 4 lead buckets: 1-6 timer, 7-12 timer, 13-24 timer, 25-48 timer
- Hver target/bucket-kombination har sin egen model
- Kun modeller der slår baseline (rå DMI) bliver promoted

**Targets:**
- **temperature**: XGBRegressor (korrektion)
- **wind_speed**: XGBRegressor (korrektion)
- **wind_gust**: XGBRegressor (korrektion)
- **rain_event**: XGBClassifier (sandsynlighed)
- **rain_amount**: XGBRegressor (kun våde timer)

### 3. dmi-vs-ml-dashboard (Hugging Face Space)
**Ansvar:** Visualisering og evaluering

**Scheduler:**
- Ingen automatisk scheduler
- Data hentes on-demand via Gradio load()
- Cache opdateres hver 5. minut (300 sekunder)

**Visninger:**
- **Temperature-tab**: DMI vs ML prognoser + verificerede historiske data
- **Wind-tab**: Vindhastighed og vindstød prognoser
- **Rain-tab**: Regnsandsynlighed og regnmængde
- **Performance-tab**: Metrikker (RMSE, MAE, Brier score) og feature importance

### 4. dmi-aarhus-weather-data (Hugging Face Dataset)
**Ansvar:** Opbevaring af træningsdata og modelartefakter

**Filer:**
| Fil | Beskrivelse |
|-----|-------------|
| `training_matrix.parquet` | Merged forecast + observations med features |
| `model_registry.json` | Aktiv model registry |
| `model_meta.json` | Træningsmetadata |
| `temperature_models.pkl` | Temperatur model bundle |
| `wind_speed_models.pkl` | Vindhastighed model bundle |
| `wind_gust_models.pkl` | Vindstød model bundle |
| `rain_event_models.pkl` | Regnhændelse model bundle |
| `rain_amount_models.pkl` | Regnmængde model bundle |

### 5. dmi-aarhus-predictions (Hugging Face Dataset)
**Ansvar:** Live predictions og verificeret historik

**Filer:**
| Fil | Beskrivelse |
|-----|-------------|
| `predictions_latest.parquet` | Nuværende 48-timers predictions |
| `frontend_snapshot.json` | Frontend-optimeret JSON snapshot |

## Data Flow

```
1. dmi-collector henter forecast data fra Open-Meteo
2. dmi-collector henter observationer fra Open-Meteo Archive
3. dmi-collector merger data til training_matrix.parquet ➜ dmi-aarhus-weather-data
4. dmi-ml-trainer træner modeller fra training_matrix.parquet
5. dmi-ml-trainer uploader model bundles ➜ dmi-aarhus-weather-data
6. dmi-collector loader modeller, genererer predictions ➜ dmi-aarhus-predictions
7. dmi-vs-ml-dashboard læser begge datasets og visualiserer
```

## Scheduler Opsummering

| Space | Scheduler | Interval | Handling |
|-------|-----------|----------|----------|
| **dmi-collector** | ✅ Ja | Hver 3. time | `generate_predictions()` - Nye 48-timers predictions |
| **dmi-collector** | ✅ Ja | Hver time | `verify_predictions()` - Verificer gamle predictions |
| **dmi-collector** | ✅ Ja | Dagligt 06:00 | `update_daily()` - Daglig dataopdatering |
| **dmi-ml-trainer** | ✅ Ja | Søndag 06:30 | `auto_retrain()` - Automatisk model retraining |
| **dmi-vs-ml-dashboard** | ❌ Nej | - | On-demand via Gradio UI |

## Teknisk Stack

- **Platform**: Hugging Face Spaces/Datasets
- **UI Framework**: Gradio
- **ML Framework**: XGBoost
- **Data**: Pandas, Parquet
- **API'er**: Open-Meteo Forecast/Archive
- **Timezones**: Europe/Copenhagen

## Lokation

- **By**: Aarhus, Danmark
- **Koordinater**: 56.1567°N, 10.2108°E
- **Datakilde**: Open-Meteo DMI HARMONIE model

## Kommandoer

Se [docs/hf-git-commands.md](docs/hf-git-commands.md) for git-kommandoer til at arbejde med spaces og datasets.

## Licens

CC0-1.0 (Public Domain)
