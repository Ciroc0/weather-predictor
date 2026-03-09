# System Context

This file is an internal working note for the local `weather-predictor` workspace. It describes how the current Hugging Face Spaces and Datasets fit together, what each repo is responsible for, and which implementation details matter when making changes.

## Workspace Layout

The parent repository is a local coordination repo. The actual deployable applications and data live in nested git repos under `hf/`.

```text
weather-predictor/
  hf/
    spaces/
      dmi-collector
      dmi-vs-ml-dashboard
      dmi-ml-trainer
    datasets/
      dmi-aarhus-predictions
      dmi-aarhus-weather-data
```

Parent repo purpose:

- Holds local setup scripts and shared working context.
- Ignores `hf/` via `.gitignore`, so the nested Hugging Face repos keep their own git history and push targets.
- Is not the deployment unit. Each nested repo must be committed and pushed independently.

## Repos And Roles

### `hf/spaces/dmi-collector`

Primary ingestion and prediction generation app.

Responsibilities:

- Fetches DMI HARMONIE forecast-like data for Aarhus through Open-Meteo.
- Fetches historical actual weather observations from Open-Meteo archive.
- Builds the training dataset and uploads it to `Ciroc0/dmi-aarhus-weather-data`.
- Loads the current ML model from `Ciroc0/dmi-aarhus-weather-data`.
- Generates future predictions and uploads them to `Ciroc0/dmi-aarhus-predictions`.
- Exposes manual actions through a Gradio UI.

Core implementation:

- `app.py` uses `timestamp` as the primary key and explicitly drops duplicates on `timestamp`, not on `reference_time`.
- Historical backfill starts at `2025-11-01`.
- Daily update window is the last 7 days.
- Future prediction window is up to 48 hours ahead.
- Features for inference are generated from DMI forecast fields plus cyclical time features.

Important code paths:

- Forecast ingestion: `fetch_forecasts_for_period()`
- Actuals ingestion: `fetch_actuals_for_period()`
- Future forecasts: `fetch_future_forecasts()`
- Training data build: `backfill_historical_data()` and `update_daily()`
- Live predictions dataset write: `update_predictions()`
- Prediction verification exists as `verify_past_predictions()`, but it is currently not wired into the scheduler or UI.
- Frontend snapshots are rebuilt from the predictions dataset and now recompute missing future ML columns before publishing.

Scheduler behavior:

- A background thread starts on app boot.
- Only `update_daily()` is scheduled automatically.
- Schedule time is `06:00` daily, using the process-local schedule loop.

Observed implications:

- The collector is the operational hub. If this Space is broken, both datasets stop evolving.
- Prediction verification is implemented but currently dormant unless called manually from code.

### `hf/spaces/dmi-ml-trainer`

Model training and deployment app.

Responsibilities:

- Loads `Ciroc0/dmi-aarhus-weather-data`.
- Trains an `XGBRegressor` to predict `dmi_error = actual_temp - dmi_temp_pred`.
- Uploads `xgb_model.pkl` and `model_meta.json` back into the weather dataset repo.

Training logic:

- Drops duplicate rows by `timestamp`.
- Sorts chronologically by `timestamp`.
- Uses a rolling holdout rule:
  rows newer than `now - 7 days` are excluded from training.
- Requires at least 100 rows total and at least 50 usable training rows after cleaning.

Feature set:

- `dmi_temp_pred`
- `dmi_wind_pred`
- `dmi_pressure_pred`
- `dmi_humidity_pred`
- `hour_sin`
- `hour_cos`
- `month_sin`
- `month_cos`
- `hour`
- `day_of_year`

Model output:

- The model predicts a correction term, not temperature directly.
- Downstream ML temperature is computed as:
  `ml_pred = dmi_temp_pred + predicted_correction`

Scheduler behavior:

- Automatic retraining is scheduled for Sunday at `02:00`.
- Manual training is exposed through a single Gradio button.

Current dataset metadata indicates:

- Last recorded training timestamp in `model_meta.json`: `2026-03-08 02:00:55+01:00`
- Training sample count: `1922`
- Training period: `2025-12-11` to `2026-03-01`

### `hf/spaces/dmi-vs-ml-dashboard`

Read-only presentation and evaluation app.

Responsibilities:

- Loads future and verified predictions from `Ciroc0/dmi-aarhus-predictions`.
- Loads the training dataset and model from `Ciroc0/dmi-aarhus-weather-data`.
- Displays two main views:
  live future forecast comparison and recent evaluation.

UI structure:

- `I morgen (Live)` tab:
  shows next 48 hours of DMI vs ML forecasts and any verified past predictions.
- `Evaluering (Sidste 7 dage)` tab:
  recomputes model outputs on recent actual historical data and compares DMI vs ML.

Evaluation logic:

- Uses the same 7-day cutoff pattern as the trainer, but in reverse:
  rows from the most recent 7 days are evaluated.
- Recreates ML predictions locally by loading `xgb_model.pkl`.
- Computes RMSE, MAE, and win percentage.

Scheduler behavior:

- A schedule loop exists, but it only logs an auto-refresh message at `13:00`.
- It does not persist data or update any dataset.
- Real refresh behavior comes from Gradio `load()` and the manual refresh button.

Observed implications:

- The dashboard is stateless and derives everything from the two datasets plus the model file.
- If the predictions dataset is stale, the live tab is stale even if the dashboard app itself is healthy.

### `hf/datasets/dmi-aarhus-weather-data`

Primary historical training dataset and model artifact repository.

Current files:

- `data.parquet`
- `xgb_model.pkl`
- `model_meta.json`

Role:

- Stores merged forecast vs actual historical weather rows for Aarhus.
- Stores the deployed model and model metadata used by both collector and dashboard.

Likely logical schema from producer code:

- `timestamp`
- `reference_time`
- `lead_time_hours`
- `dmi_temp_pred`
- `dmi_wind_pred`
- `dmi_pressure_pred`
- `dmi_humidity_pred`
- `actual_temp`
- `actual_wind`
- `actual_pressure`
- `actual_humidity`
- `hour`
- `day_of_year`
- `month`
- `hour_sin`
- `hour_cos`
- `month_sin`
- `month_cos`
- `dmi_error`

Operational note:

- This dataset is the system of record for training and recent offline evaluation.
- The `xgb_model.pkl` in this repo is the deployed model artifact.

### `hf/datasets/dmi-aarhus-predictions`

Live prediction store.

Current files:

- `predictions.parquet`

Role:

- Stores future predictions generated by the collector.
- Stores later verification results when predictions can be matched with actuals.

Likely logical schema from producer code:

- `timestamp`
- `reference_time`
- `lead_time_hours`
- `dmi_temp_pred`
- `dmi_wind_pred`
- `dmi_pressure_pred`
- `dmi_humidity_pred`
- `ml_pred`
- `prediction_made_at`
- `city`
- `verified`
- `actual_temp`

Operational note:

- The collector replaces any existing row with the same `timestamp` before appending new predictions.
- `verified` rows are what power the dashboard's realized performance comparison.

## End-To-End Data Flow

Normal operating flow:

1. `dmi-collector` fetches forecast data and actual weather observations from Open-Meteo.
2. `dmi-collector` merges them into historical training rows and uploads `data.parquet` to `dmi-aarhus-weather-data`.
3. `dmi-ml-trainer` trains a correction model from `data.parquet`.
4. `dmi-ml-trainer` uploads `xgb_model.pkl` and `model_meta.json` to `dmi-aarhus-weather-data`.
5. `dmi-collector` loads `xgb_model.pkl`, generates future `ml_pred` values, and uploads `predictions.parquet` to `dmi-aarhus-predictions`.
6. `dmi-vs-ml-dashboard` reads both datasets and visualizes future forecasts and recent realized accuracy.

## Key Design Choices

### `timestamp` is the primary key

This is the most important design rule in the current codebase.

- All three Spaces treat `timestamp` as the target weather time.
- Duplicate removal consistently uses `timestamp`.
- Earlier behavior appears to have been more tied to `reference_time`, but the current implementation has been corrected toward `timestamp`.

Why it matters:

- `reference_time` is the forecast run time.
- Many forecasted rows share the same `reference_time`.
- Using `reference_time` as uniqueness key would collapse valid forecast horizons incorrectly.

### Timezone standardization is centered on Copenhagen time

All apps explicitly normalize time to `Europe/Copenhagen`.

Why it matters:

- Open-Meteo responses are requested in Copenhagen time.
- The UI is intended for Danish users.
- Recent fixes in the dashboard focus on making both `timestamp` and `reference_time` timezone-aware after loading from Hugging Face datasets.

### Model predicts a correction, not the final value directly

The model target is `dmi_error`, not actual temperature.

Why it matters:

- The ML system is designed as an adjustment layer on top of DMI/Open-Meteo forecast values.
- Any future model changes must preserve compatibility with code that computes `ml_pred = dmi_temp_pred + correction`.

## Drift And Scheduling Notes

Current scheduled actions in code:

- Collector:
  daily `update_daily()` at `06:00`
- Trainer:
  Sunday `auto_retrain()` at `02:00`
- Dashboard:
  log-only refresh hook at `13:00`

Important limitation:

- These schedules run in process-local Python threads using the `schedule` library.
- They depend on the Space process staying alive and on Hugging Face runtime behavior.
- There is no separate orchestration layer, external cron, or job queue in this repo.

## Dependencies And External Services

External services:

- Open-Meteo forecast API
- Open-Meteo archive API
- Hugging Face Hub datasets
- Hugging Face Spaces runtime

Python dependencies by role:

- Gradio for UI on all Spaces
- `datasets` and `huggingface_hub` for Hub reads/writes
- `pandas` and `numpy` for data shaping
- `xgboost` and `joblib` for model train/load
- `plotly` for dashboard charts
- `schedule` for in-process scheduling
- `tzdata` / `zoneinfo` for timezone handling

## Current Risks And Weak Spots

### Verification path is not operationally wired

`verify_past_predictions()` exists in `dmi-collector`, but it is not scheduled and not exposed in the current Gradio UI. That means `verified` data may stop accumulating unless verification is triggered elsewhere.

### Schedule reliability depends on Space uptime

If a Space sleeps, restarts, or is not continuously running, scheduled tasks may be skipped.

### Data writes are file replacement uploads

The apps write local parquet or model files and then upload them to the dataset repo. There is no transactional protection between fetch, local write, and upload.

### Dataset repos are artifact stores, not source repos

Most commits in the dataset repos are generated upload commits such as `Upload data.parquet with huggingface_hub`. Treat them as generated state, not hand-maintained source history.

### Encoding output looked inconsistent in terminal inspection

The source files contain Danish text and emoji. In shell output they rendered with mojibake, which is likely a terminal codepage issue rather than broken source. Still, any text-edit changes should be verified carefully to avoid accidental encoding regressions.

## Working Rules For Future Changes

- Make source-code changes in the specific nested repo, not in the parent repo.
- Commit and push each affected nested repo independently.
- Do not assume the parent repo's git status tells anything about the nested repos.
- Preserve `timestamp`-based deduplication unless there is a very explicit migration plan.
- Be careful when changing scheduler behavior because a hidden job dependency currently exists between collector, trainer, and dashboard freshness.
- When changing feature engineering in the collector, update trainer and dashboard expectations at the same time.
- When changing dataset schema, treat both datasets and all three Spaces as one coordinated system.

## Useful Local Commands

Run inside `weather-predictor`:

```powershell
git -C .\hf\spaces\dmi-collector status -sb
git -C .\hf\spaces\dmi-vs-ml-dashboard status -sb
git -C .\hf\spaces\dmi-ml-trainer status -sb
git -C .\hf\datasets\dmi-aarhus-weather-data status -sb
git -C .\hf\datasets\dmi-aarhus-predictions status -sb
```

Push a changed nested repo:

```powershell
git -C .\hf\spaces\dmi-collector add .
git -C .\hf\spaces\dmi-collector commit -m "Describe change"
git -C .\hf\spaces\dmi-collector push
```

This same pattern applies to each nested Space or Dataset repo.
