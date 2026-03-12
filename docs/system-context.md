# System Context

Dette dokument beskriver den faktiske struktur i workspace'et pr. nu og skal læses som intern source of truth for arkitektur og drift.

## Workspace layout

```text
weather-predictor/
  README.md
  NOTICE
  docs/
  scripts/
  frontend/
  hf/
    spaces/
      dmi-collector/
      dmi-ml-trainer/
      dmi-vs-ml-dashboard/
    datasets/
      dmi-aarhus-weather-data/
      dmi-aarhus-predictions/
```

Vigtig nuance:

- `frontend/` er en del af root-repoet og kan deployes herfra
- alle mapper under `hf/` er selvstændige git-repos
- root-repoet er derfor både koordineringsrepo og hjemsted for frontenden, men ikke deployment-enhed for Hugging Face Spaces

## Repos og ansvar

### `frontend/`

Public webapp bygget med Vite, React 19 og TypeScript.

Ansvar:

- kalder `/api/dashboard`
- viser forecast, historisk backtest, verification og modelstatus
- bruger `frontend_snapshot.json` som primær datakontrakt
- falder tilbage til Hugging Face dataset-server JSON, hvis snapshot mangler

Teknisk note:

- `frontend/api/dashboard.js` er Vercel-funktionen
- `frontend/src/lib/seo.ts` peger aktuelt på produktets public site-URL
- `frontend/public/robots.txt` og `frontend/public/sitemap.xml` er aktive SEO-artefakter

### `hf/spaces/dmi-collector`

Operational hub for data ingestion og live predictions.

Ansvar:

- henter forecast-runs fra Open-Meteo for Aarhus
- henter observationer fra Open-Meteo Archive
- bygger `training_matrix.parquet`
- loader aktive modelbundles fra weather-datasættet
- genererer live predictions til predictions-datasættet
- verificerer gamle predictions mod actuals
- bygger og uploader `frontend_snapshot.json`

Faktisk scheduler fra koden:

- predictions: `00:35`, `03:35`, `06:35`, `09:35`, `12:35`, `15:35`, `18:35`, `21:35`
- verification: hver time `:12`
- daily update: `05:45`

Startup-adfærd:

- efter ca. 20 sekunder kører en catch-up-tråd
- hvis træningsdata mangler eller er for gamle, kører `update_daily()`
- hvis future predictions mangler, kører `generate_predictions()`
- hvis uverificerede historiske predictions er forfaldne, kører `verify_predictions()`

Output:

- `training_matrix.parquet` til `dmi-aarhus-weather-data`
- `predictions_latest.parquet` til `dmi-aarhus-predictions`
- `frontend_snapshot.json` til `dmi-aarhus-predictions`

Kompatibilitet:

- loader både `training_matrix.parquet` og legacy `data.parquet`
- loader både `predictions_latest.parquet` og legacy `predictions.parquet`

### `hf/spaces/dmi-ml-trainer`

Multi-target modeltræner.

Ansvar:

- læser `training_matrix.parquet`
- træner bucketed modeller for fem targets
- uploader modelbundles, `model_registry.json` og `model_meta.json`
- viser aktiv registry og træningsstatus i Gradio

Faktisk scheduler fra koden:

- søndag `06:50`

Targets:

- `temperature`
- `wind_speed`
- `wind_gust`
- `rain_event`
- `rain_amount`

Modelstrategi:

- correction-modeller for temperatur, vindhastighed og vindstød
- klassifikation for regnhændelse
- regressionsmodel for regnmængde
- promotion sker kun bucket-for-bucket, hvis ML slår baseline

### `hf/spaces/dmi-vs-ml-dashboard`

Read-only Gradio-dashboard.

Ansvar:

- loader predictions og træningsdata
- rekonstruerer backtest for de seneste 7 dage
- visualiserer temperatur, vind, regn og performance

Drift:

- ingen scheduler
- cache TTL `300` sekunder
- future-vindue `48` timer
- historisk evalueringsvindue `7` dage

Kompatibilitet:

- predictions loader først `predictions_latest.parquet`, derefter `predictions.parquet`
- training loader først `training_matrix.parquet`, derefter `data.parquet`

### `hf/datasets/dmi-aarhus-weather-data`

System of record for træningsdata og aktive modelbundles.

Aktive filer:

- `training_matrix.parquet`
- `model_registry.json`
- `model_meta.json`
- `temperature_models.pkl`
- `wind_speed_models.pkl`
- `wind_gust_models.pkl`
- `rain_event_models.pkl`
- `rain_amount_models.pkl`

Legacy/kompatibilitetsfiler:

- `data.parquet`
- `xgb_model.pkl`

Bemærkning:

- `xgb_model.pkl` er et ældre single-target artefakt og bruges ikke af den nuværende multi-target promotion-pipeline

### `hf/datasets/dmi-aarhus-predictions`

System of record for live predictions og frontendkontrakt.

Aktive filer:

- `predictions_latest.parquet`
- `frontend_snapshot.json`

Legacy/kompatibilitetsfiler:

- `predictions.parquet`
- `history_snapshot.json`

Bemærkning:

- `history_snapshot.json` læses kun af frontendens legacy fallback-kode; den primære kontrakt er `frontend_snapshot.json`

## End-to-end flow

1. `dmi-collector` henter forecast og observationer via Open-Meteo.
2. `dmi-collector` bygger træningsmatrix og uploader den til `dmi-aarhus-weather-data`.
3. `dmi-ml-trainer` træner bucketed modeller og uploader aktive bundles og registry.
4. `dmi-collector` loader aktive bundles og genererer nye predictions.
5. `dmi-collector` verificerer historiske predictions, når actuals foreligger.
6. `dmi-collector` publicerer `frontend_snapshot.json`.
7. `frontend/` og `dmi-vs-ml-dashboard` læser datasættet og visualiserer resultaterne.

## Nøgledesignvalg

### `target_timestamp` er den vigtige forecast-identitet

Den nuværende kode normaliserer omkring forecastets målte tidspunkt, ikke kun forecast-run tidspunktet.

Hvorfor det betyder noget:

- mange rækker deler samme `reference_time`
- flere valid forecast-points må derfor ikke kollapses blot fordi de kom fra samme run

### Timezone er `Europe/Copenhagen`

Alle apps normaliserer timestamps til `Europe/Copenhagen`.

Hvorfor det betyder noget:

- scheduler-tider skal læses som København-tid
- UI, snapshot og verification er bygget til danske brugere

### Frontend-snapshot er den primære public kontrakt

`frontend_snapshot.json` er den vigtigste integration mellem collector og public webapp.

Hvorfor det betyder noget:

- frontend-fallbacks findes stadig, men de er sekundære
- ændringer i snapshot-schema skal koordineres med både `frontend/` og eventuelle public consumers

## Aktuelle svagheder og opmærksomhedspunkter

- Legacy-filer (`data.parquet`, `xgb_model.pkl`, `predictions.parquet`, `history_snapshot.json`) eksisterer stadig og gør dokumentation mere kompleks.
- Schedulerne kører som in-process Python-tråde og er derfor afhængige af Space-uptime.
- Open-Meteo gratis/open access er ikke markeret som kommercielt brugbar pr. 12. marts 2026.
- Root-repoets dokumentation skal derfor tydeligt skelne mellem kode, data og tredjepartsdatarettigheder.
