# Hugging Face Git Commands

Præcise PowerShell-kommandoer til at arbejde med alle lokale Hugging Face-spaces og datasets i dette repo.

## Spaces

### `dmi-collector`

```powershell
git -C .\hf\spaces\dmi-collector status -sb
git -C .\hf\spaces\dmi-collector pull --ff-only
git -C .\hf\spaces\dmi-collector add .
git -C .\hf\spaces\dmi-collector commit -m "Change for frontend"
git -C .\hf\spaces\dmi-collector push
git -C .\hf\spaces\dmi-collector remote -v
```

### `dmi-ml-trainer`

```powershell
git -C .\hf\spaces\dmi-ml-trainer status -sb
git -C .\hf\spaces\dmi-ml-trainer pull --ff-only
git -C .\hf\spaces\dmi-ml-trainer add .
git -C .\hf\spaces\dmi-ml-trainer commit -m "Describe change"
git -C .\hf\spaces\dmi-ml-trainer push
git -C .\hf\spaces\dmi-ml-trainer remote -v
```

### `dmi-vs-ml-dashboard`

```powershell
git -C .\hf\spaces\dmi-vs-ml-dashboard status -sb
git -C .\hf\spaces\dmi-vs-ml-dashboard pull --ff-only
git -C .\hf\spaces\dmi-vs-ml-dashboard add .
git -C .\hf\spaces\dmi-vs-ml-dashboard commit -m "Describe change"
git -C .\hf\spaces\dmi-vs-ml-dashboard push
git -C .\hf\spaces\dmi-vs-ml-dashboard remote -v
```

## Datasets

### `dmi-aarhus-weather-data`

```powershell
git -C .\hf\datasets\dmi-aarhus-weather-data status -sb
git -C .\hf\datasets\dmi-aarhus-weather-data pull --ff-only
git -C .\hf\datasets\dmi-aarhus-weather-data add .
git -C .\hf\datasets\dmi-aarhus-weather-data commit -m "Describe change"
git -C .\hf\datasets\dmi-aarhus-weather-data push
git -C .\hf\datasets\dmi-aarhus-weather-data remote -v
```

### `dmi-aarhus-predictions`

```powershell
git -C .\hf\datasets\dmi-aarhus-predictions status -sb
git -C .\hf\datasets\dmi-aarhus-predictions pull --ff-only
git -C .\hf\datasets\dmi-aarhus-predictions add .
git -C .\hf\datasets\dmi-aarhus-predictions commit -m "Describe change"
git -C .\hf\datasets\dmi-aarhus-predictions push
git -C .\hf\datasets\dmi-aarhus-predictions remote -v
```

## Quick Reference

Pull alt:

```powershell
git -C .\hf\spaces\dmi-collector pull --ff-only
git -C .\hf\spaces\dmi-ml-trainer pull --ff-only
git -C .\hf\spaces\dmi-vs-ml-dashboard pull --ff-only
git -C .\hf\datasets\dmi-aarhus-weather-data pull --ff-only
git -C .\hf\datasets\dmi-aarhus-predictions pull --ff-only
```

Vis status for alt:

```powershell
git -C .\hf\spaces\dmi-collector status -sb
git -C .\hf\spaces\dmi-ml-trainer status -sb
git -C .\hf\spaces\dmi-vs-ml-dashboard status -sb
git -C .\hf\datasets\dmi-aarhus-weather-data status -sb
git -C .\hf\datasets\dmi-aarhus-predictions status -sb
```
