# Current Plan

Dette dokument er ikke længere en fremtidsvision for "hvad vi måske vil bygge". Det beskriver nu den aktuelle leverance og de vigtigste næste skridt.

## Implementeret nu

- Aarhus-scope er fast og hardcoded på tværs af Spaces, datasets og frontend.
- Collector opdaterer træningsdata, genererer predictions, verificerer historik og publicerer frontend-snapshot.
- Trainer håndterer fem targets og fire lead buckets med promotion mod baseline.
- Dashboard Space visualiserer future forecast og historisk backtest.
- Vercel-frontenden læser public snapshot fra Hugging Face og har separate sider for temperatur, vind, regn og performance.

## Højeste næste prioritet

### 1. Licens- og data governance

- hold licensmetadata synkroniseret mellem GitHub og Hugging Face
- bevar en konsekvent personlig ophavsangivelse
- afklar Open-Meteo licens/plan ved kommerciel brug

### 2. Oprydning i legacy artefakter

- beslut om `data.parquet` stadig skal bevares
- beslut om `xgb_model.pkl` skal slettes eller dokumenteres permanent som legacy
- beslut om `predictions.parquet` og `history_snapshot.json` skal udfases

### 3. Schema governance

- dokumentér `frontend_snapshot.json` som versioneret kontrakt
- dokumentér kompatibilitetsgarantier ved ændringer i prediction/data-schema

### 4. Driftssikkerhed

- vurder om schedulerne skal flyttes til en mere robust orchestrering end in-process tråde
- dokumentér monitoring, expected freshness og failure modes

### 5. Public project hygiene

- overvej `CONTRIBUTING.md`, `SECURITY.md` og evt. `CODEOWNERS`
- overvej CI-checks for docs, schema og linkvaliditet

## Beslutninger der allerede er taget

- fokus er Aarhus, ikke multi-city
- modelmotoren er XGBoost
- frontendens public kontrakt er `frontend_snapshot.json`
- permissiv open-source kode kombineres med attribution-bærende docs/data-licens
