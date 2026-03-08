# Deploy Guide - Weather Predictor Spaces

## Status

Alle 3 spaces er opdateret ifølge PLAN.md. Koden er klar til deploy.

## Ændringer

### 1. dmi-collector
- Udvidet feature set med 20+ vejrparametre
- Understøtter multi-target (temperatur, vind, regn)
- Nye filer: `training_matrix.parquet`, `predictions_latest.parquet`
- Scheduler: Hver 3. time forecasts, hver time observations og verifikation

### 2. dmi-ml-trainer
- Multi-target model training (5 targets)
- Lead bucket modeller (1-6h, 7-12h, 13-24h, 25-48h)
- Model registry og feature importance
- Auto-promote kun hvis model slår baseline

### 3. dmi-vs-ml-dashboard
- 4 faner: Temperatur, Vind, Regn, Performance
- Plotly visualiseringer
- Verifikations tracking

## Deploy Trin

### Trin 1: Commit og push hver space

Kør følgende kommandoer i PowerShell:

```powershell
# DMI Collector
git -C .\hf\spaces\dmi-collector add .
git -C .\hf\spaces\dmi-collector commit -m "Implement PLAN.md: extended features, multi-target support"
git -C .\hf\spaces\dmi-collector push

# ML Trainer  
git -C .\hf\spaces\dmi-ml-trainer add .
git -C .\hf\spaces\dmi-ml-trainer commit -m "Implement PLAN.md: multi-target model training"
git -C .\hf\spaces\dmi-ml-trainer push

# Dashboard
git -C .\hf\spaces\dmi-vs-ml-dashboard add .
git -C .\hf\spaces\dmi-vs-ml-dashboard commit -m "Implement PLAN.md: multi-tab dashboard"
git -C .\hf\spaces\dmi-vs-ml-dashboard push
```

### Trin 2: Restart spaces på Hugging Face

Da dit token er read-only, skal du manuelt restarte spaces:

1. Gå til https://huggingface.co/spaces/Ciroc0/dmi-collector
2. Klik "Factory reboot" (tre prikker menu øverst til højre)
3. Vent på at space starter
4. Gør det samme for de andre spaces:
   - https://huggingface.co/spaces/Ciroc0/dmi-ml-trainer
   - https://huggingface.co/spaces/Ciroc0/dmi-vs-ml-dashboard

### Trin 3: Initialisering

Når spaces er startet:

1. Gå til **dmi-collector** space
2. Klik "Backfill Historical Data" for at hente historisk data
3. Vent på at data er uploadet
4. Gå til **dmi-ml-trainer** space
5. Klik "Train and Deploy All Aarhus Models"
6. Gå tilbage til **dmi-collector** og klik "Generate Predictions"

### Trin 4: Verifikation

Gå til **dmi-vs-ml-dashboard** og tjek at:
- Alle 4 faner vises korrekt
- Data loader uden fejl
- Grafer vises

## Fejlfinding

### Hvis spaces stadig er stuck i "starting"
- Tjek HF logs (Space settings -> Logs)
- Sænk Gradio version i requirements.txt til `gradio>=4.0.0`
- Slet og genskab space (Factory rebuild)

### Hvis data ikke loader
- Tjek at HF_TOKEN er sat i Space secrets
- Verificér at datasets eksisterer

### Hvis modeller fejler
- Sørg for at der er nok data i training_matrix.parquet
- Tjek at feature kolonner matcher mellem collector og trainer

## Videreudvikling

Efter initialisering kører systemet automatisk:
- Collector: Hver 3. time nye forecasts
- Trainer: Hver søndag auto-retrain
- Dashboard: Real-time visning
