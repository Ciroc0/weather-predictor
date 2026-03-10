# Plan: Udbyg `weather-predictor` til et Aarhus-fokuseret vejrprodukt

## Summary

Produktet forbliver stramt scoped til **Aarhus**. Målet er at gå fra en simpel temperatur-korrektion til et **Aarhus-vejrprodukt** med tre hovedspor:

- bedre temperaturprognoser
- nye prognoser for regn og vind
- stærkere evaluering og verifikation mod faktiske Aarhus-målinger

Arkitekturen forbliver på Hugging Face Spaces/Datasets, men datagrundlaget udvides markant med flere forecast-features og bedre observationsdata. Alt designes stadig som **single-city pipeline** for Aarhus, ikke som multi-by platform.

## Key Changes

### 1. Data og scope

Fast scope:

- kun Aarhus i denne iteration
- ingen generalisering til andre byer
- ingen by-parameter i UI, datasets eller modelvalg

Datakilder:

- DMI observationsdata for Aarhus/nærmeste relevante stationer som sandhedskilde
- DMI/Open-Meteo forecast-data for Aarhus som forecast-input
- Open-Meteo historical forecast-data med `dmi_harmonie` som primær kilde til historiske forecast-runs

Aarhus-specifik beslutning:

- systemet skal have en fast “Aarhus station resolver”, men kun til intern robusthed
- resolveren må vælge nærmeste aktive station(er) omkring Aarhus, hvis en bestemt station flytter eller er utilgængelig
- output og produkt omtales stadig kun som “Aarhus”

Collector skal udvide datalaget til mindst disse artefakter i `dmi-aarhus-weather-data`:

- `observations.parquet`
- `forecast_runs.parquet`
- `training_matrix.parquet`
- `model_registry.json`
- modelartefakter for temperatur, vind og regn

Predictions-dataset skal udvides til:

- `predictions_latest.parquet`
- `predictions_history.parquet`
- `verification.parquet`

### 2. Forecast-produkt for Aarhus

Produktet skal i v1 have disse Aarhus-outputs:

- temperatur
- vindhastighed
- vindstød
- regn sandsynlighed
- regnmængde

Feature-sæt for Aarhus-forecast bør som minimum udvides med:

- temperatur, apparent temperature
- fugt, dugpunkt, tryk
- cloud cover lav/mellem/høj
- precipitation, rain, snowfall
- precipitation probability
- wind speed, wind direction, wind gusts
- visibility
- shortwave radiation, sunshine duration
- weather code
- CAPE hvis tilgængelig stabilt

Afledte Aarhus-features:

- lead time og lead buckets
- døgn- og sæsoncyklus
- vindkomponenter
- ændring mellem forecast-runs for samme target-tid
- seneste observerede Aarhus-værdier
- rolling 3h/6h/12h observationer for Aarhus

Targets:

- `actual_temp`
- `actual_wind_speed`
- `actual_wind_gust`
- `rain_event`
- `rain_amount`

### 3. Modelstrategi

Bliv på XGBoost i v1.

Modelopbygning:

- temperatur: `XGBRegressor`, correction-model mod rå forecast
- vindhastighed: `XGBRegressor`
- vindstød: `XGBRegressor`
- regn-hændelse: `XGBClassifier`
- regnmængde: `XGBRegressor` kun på våde timer

Brug 4 lead buckets:

- `1-6`
- `7-12`
- `13-24`
- `25-48`

Det giver i praksis Aarhus-specifikke modeller pr. signal og forecast-horisont.

Aktiveringsregel:

- en ny model bliver kun aktiv, hvis den slår rå DMI-forecast på validation for Aarhus
- ellers beholdes forrige aktive model

### 4. Spaces og drift

`dmi-collector` er Aarhus driftshub og:

- henter Aarhus forecast-runs fra Open-Meteo
- henter Aarhus observationer fra Open-Meteo Archive
- bygger training matrix
- genererer 48-timers Aarhus-predictions
- verificerer gamle predictions
- skriver dataset-filer og metrics
- publicerer frontend snapshot JSON

**Scheduler i dmi-collector (fra `app.py`):**

| Interval | Handling | Beskrivelse |
|----------|----------|-------------|
| Hver 3. time | `generate_predictions()` | Genererer nye 48-timers ML-forudsigelser for temperatur, vind og regn |
| Hver time | `verify_predictions()` | Verificerer gamle predictions mod faktiske observationer |
| Dagligt kl. 06:00 | `update_daily()` | Henter forecast og observationsdata for de sidste 7 dage |

Bemærk: Ved startup kører catch-up logik der automatisk opdaterer hvis data mangler.

`dmi-ml-trainer` skal udvides til at vise:

- aktive Aarhus-modeller
- metrics pr. target og lead bucket
- feature importance
- manuel retrain/promote

`dmi-vs-ml-dashboard` viser Aarhus-vejrdata med faner for:

- **Temperature**: DMI vs ML prognoser + verificerede historiske data
- **Wind**: Vindhastighed og vindstød prognoser
- **Rain**: Regnsandsynlighed og regnmængde
- **Performance**: Metrikker (RMSE, MAE, Brier score) og feature importance

**Scheduler:** Ingen automatisk scheduler - data hentes on-demand via Gradio load() med 5-minutters cache.

UI-tekst og labels er Aarhus-specifikke.

## Test Plan

Følgende skal være grønt for Aarhus:

- observationer kan hentes og lagres for Aarhus uden manuel indgriben
- station fallback virker, men output forbliver Aarhus
- training matrix bygges uden duplicate target-timestamps
- temperatur-, vind- og regnmodeller træner for alle lead buckets
- prediction job skriver komplette 48-timers Aarhus-forecasts
- verification matcher rigtige Aarhus-actuals korrekt
- dashboard loader alle nye signaler uden schemafejl
- collector kan genstarte og stadig reetablere predictions/verifikation automatisk

Acceptkriterier:

- temperatur RMSE mindst 5% bedre end rå DMI på Aarhus holdout
- vind MAE mindst 5% bedre end rå DMI på Aarhus holdout
- regnmodel skal slå rå forecast-baseline på F1 eller Brier score
- ingen model må promotes, hvis den er dårligere end baseline for Aarhus

## Assumptions

- Scope er låst til Aarhus.
- Der indføres ingen support for andre byer i denne iteration.
- Hugging Face Spaces/Datasets forbliver platformen.
- DMI observationsdata bruges som primary truth for Aarhus actuals.
- Open-Meteo historical forecast bruges som primær historisk forecast-kilde, med DMI endpoints som supplement ved behov.
- XGBoost er fælles modelmotor i v1.
