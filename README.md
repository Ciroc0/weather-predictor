# Weather Predictor / Aarhus Vejr

`weather-predictor` er et Aarhus-fokuseret vejrprodukt, der kombinerer Open-Meteos DMI HARMONIE-prognoser med lokale ML-korrektioner for temperatur, vind og regn. Projektet vedligeholdes af `Ciroc0`.

## Hvad repoet indeholder

Dette root-repo er den samlede arbejdsmappe for hele systemet:

| Del | Placering | Rolle |
| --- | --- | --- |
| Vercel-frontend | `frontend/` | Public webapp, som viser forecast, historik og modelperformance |
| Collector Space | `hf/spaces/dmi-collector/` | Henter forecast- og observationsdata, bygger træningsmatrix, genererer predictions og publicerer snapshots |
| Trainer Space | `hf/spaces/dmi-ml-trainer/` | Træner og deployer bucketed modeller for temperatur, vind og regn |
| Dashboard Space | `hf/spaces/dmi-vs-ml-dashboard/` | Gradio-dashboard til read-only visualisering og evaluering |
| Weather dataset | `hf/datasets/dmi-aarhus-weather-data/` | Træningsdata, modelbundles og modelmetadata |
| Predictions dataset | `hf/datasets/dmi-aarhus-predictions/` | Live predictions, verificerede actuals og frontend-snapshots |
| Fælles docs | `docs/` | Intern arbejdsdokumentation, driftsoverblik og licensnoter |

Alle Hugging Face mapper under `hf/` er selvstændige git-repos med deres egen historik og push-target.

## Arkitektur

```text
Open-Meteo forecast + archive
            |
            v
hf/spaces/dmi-collector
  - update_daily()
  - generate_predictions()
  - verify_predictions()
  - publish_frontend_snapshot()
            |
            +--> hf/datasets/dmi-aarhus-weather-data
            |      - training_matrix.parquet
            |      - model_registry.json
            |      - model_meta.json
            |      - *_models.pkl
            |
            +--> hf/datasets/dmi-aarhus-predictions
                   - predictions_latest.parquet
                   - frontend_snapshot.json
                   - compatibility files
            |
            +--> frontend/api/dashboard.js
            |      - reads frontend_snapshot.json first
            |      - falls back to HF datasets-server if needed
            |
            +--> hf/spaces/dmi-vs-ml-dashboard

hf/spaces/dmi-ml-trainer
  - retrains weekly
  - promotes only buckets that beat baseline
```

## Drift lige nu

### `hf/spaces/dmi-collector`

- Scheduler for predictions: `00:35`, `03:35`, `06:35`, `09:35`, `12:35`, `15:35`, `18:35`, `21:35`
- Scheduler for verification: hver time `:12`
- Scheduler for daily update: dagligt `05:45`
- Startup-catch-up kører automatisk, hvis data eller predictions mangler efter restart

### `hf/spaces/dmi-ml-trainer`

- Scheduler for retraining: søndag `06:50`
- Træner op til 20 bucketed modeller: 5 targets x 4 lead buckets
- Promotion er additiv: eksisterende model beholdes, hvis ny model ikke slår baseline

### `hf/spaces/dmi-vs-ml-dashboard`

- Ingen scheduler
- Cache TTL: `300` sekunder
- Læser prediction-fil via `predictions_latest.parquet` og falder tilbage til legacy `predictions.parquet`

### `frontend/`

- Vite + React 19 + TypeScript
- Deployes som Vercel-frontend med serverless endpoint i `frontend/api/dashboard.js`
- Læser først `frontend_snapshot.json` fra Hugging Face og falder ellers tilbage til dataset-server JSON

## Data og artefakter

### Primære artefakter i `hf/datasets/dmi-aarhus-weather-data`

- `training_matrix.parquet`: source of truth for træningsdata
- `model_registry.json`: aktive target/bucket-modeller
- `model_meta.json`: seneste træningsmetadata
- `temperature_models.pkl`
- `wind_speed_models.pkl`
- `wind_gust_models.pkl`
- `rain_event_models.pkl`
- `rain_amount_models.pkl`

### Kompatibilitetsartefakter i `hf/datasets/dmi-aarhus-weather-data`

- `data.parquet`: legacy fallback, stadig læsbar i kode af kompatibilitetshensyn
- `xgb_model.pkl`: legacy single-target temperaturmodel, ikke source of truth i den nuværende multi-target pipeline

### Primære artefakter i `hf/datasets/dmi-aarhus-predictions`

- `predictions_latest.parquet`: nuværende future + verified prediction-store
- `frontend_snapshot.json`: primær kontrakt til Vercel-frontenden

### Kompatibilitetsartefakter i `hf/datasets/dmi-aarhus-predictions`

- `predictions.parquet`: legacy fallback
- `history_snapshot.json`: legacy fallback læst af ældre frontend-fallbackkode; ikke den primære public kontrakt længere

## Modeller

Aktuelle targettyper i koden:

- `temperature`: `XGBRegressor` som korrektionsmodel oven på DMI forecast
- `wind_speed`: `XGBRegressor` som korrektionsmodel
- `wind_gust`: `XGBRegressor` som korrektionsmodel
- `rain_event`: `XGBClassifier` for sandsynlighed for regn
- `rain_amount`: `XGBRegressor` for mængde, kun hvor regn er relevant

Lead buckets:

- `1-6`
- `7-12`
- `13-24`
- `25-48`

## Lokal udvikling

### Frontend

```powershell
cd .\frontend
npm install
npm run dev
```

### Status på Hugging Face repos

Se [docs/hf-git-commands.md](/d:/Dev/Active/weather-predictor/docs/hf-git-commands.md) for præcise PowerShell-kommandoer til hver Space og hvert dataset.

### Vigtige dokumenter

- [docs/system-context.md](/d:/Dev/Active/weather-predictor/docs/system-context.md): intern arkitektur og source-of-truth for runtime-adfærd
- [docs/licensing.md](/d:/Dev/Active/weather-predictor/docs/licensing.md): licensmodel, covered paths og attribution-krav
- [docs/PLAN.md](/d:/Dev/Active/weather-predictor/docs/PLAN.md): aktuel status og næste oprydnings-/produktspor

## Licens og attribution

Projektet bruger en bevidst multi-license-model:

- Kode i root-repoet, `frontend/`, `scripts/` og Hugging Face Spaces er under `Apache-2.0`
- Dokumentation, README-filer, datasets, modelartefakter og public snapshots er under `CC BY 4.0`

Praktisk konsekvens:

- Folk må gerne bruge, ændre og redistribuere projektet
- Attribution til projektets ophavsangivelse skal bevares
- `NOTICE`-filen i roden skal bevares ved redistribuering af koden

Se den fulde model i [docs/licensing.md](/d:/Dev/Active/weather-predictor/docs/licensing.md).

## Datakilder og tredjepartsforhold

- Forecasts og observationer hentes via Open-Meteo
- Forecast-grundlaget er Open-Meteos adgang til DMI HARMONIE
- DMI og Open-Meteo skal krediteres i redistribueringer af data og snapshots

Vigtigt:

- DMI angiver generelt frie data under `CC BY 4.0`, men ikke alt materiale på dmi.dk er frit genbrugeligt
- Open-Meteos open-access side angiver pr. 12. marts 2026, at gratis/open access ikke er til kommerciel brug
