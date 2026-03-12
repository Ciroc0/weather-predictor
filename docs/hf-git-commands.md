# Hugging Face Git Commands

Præcise PowerShell-kommandoer til de selvstændige Hugging Face-repos i workspace'et.

## Vigtigt

- Root-repoet og `frontend/` ligger i hovedrepoet.
- Alle mapper under `hf/` er separate git-repos.
- Commit og push derfor hver Space og hvert dataset separat.

## Spaces

### `dmi-collector`

```powershell
git -C .\hf\spaces\dmi-collector status -sb
git -C .\hf\spaces\dmi-collector pull --ff-only
git -C .\hf\spaces\dmi-collector add .
git -C .\hf\spaces\dmi-collector commit -m "Describe change"
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

## Root-repo og frontend

```powershell
git status -sb
git add .
git commit -m "Describe change"
git push
```

## Hurtig reference

Pull alle HF-repos:

```powershell
git -C .\hf\spaces\dmi-collector pull --ff-only
git -C .\hf\spaces\dmi-ml-trainer pull --ff-only
git -C .\hf\spaces\dmi-vs-ml-dashboard pull --ff-only
git -C .\hf\datasets\dmi-aarhus-weather-data pull --ff-only
git -C .\hf\datasets\dmi-aarhus-predictions pull --ff-only
```

Vis status for hele workspace-strukturen:

```powershell
git status -sb
git -C .\hf\spaces\dmi-collector status -sb
git -C .\hf\spaces\dmi-ml-trainer status -sb
git -C .\hf\spaces\dmi-vs-ml-dashboard status -sb
git -C .\hf\datasets\dmi-aarhus-weather-data status -sb
git -C .\hf\datasets\dmi-aarhus-predictions status -sb
```
