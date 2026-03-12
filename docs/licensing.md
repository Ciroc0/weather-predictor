# Licensing

Dette projekt er tænkt som åbent og genbrugeligt, men attribution til projektets ophavsangivelse skal bevares.

## Valgt model

### 1. Kode: `Apache-2.0`

Gælder for:

- `frontend/**`
- `scripts/**`
- `hf/spaces/**`
- øvrige kodefiler i root-repoet

Hvorfor:

- permissiv open source-licens
- kræver bevaring af copyright- og notice-information
- giver patentgrant, hvilket er bedre end MIT/BSD i et ML/software-projekt

### 2. Dokumentation, data, modeller og snapshots: `CC BY 4.0`

Gælder for:

- `README.md`
- `docs/**`
- `hf/**/README.md`
- `hf/datasets/**`
- genererede JSON/Parquet snapshots og modelartefakter

Hvorfor:

- eksplicit attribution-krav passer bedre til dokumentation og data end Apache
- matcher også upstream-virkeligheden bedre, fordi Open-Meteo og DMI kræver attribution

## Attributionstekst

Når projektet eller afledte værker redistribueres, bør attribution minimum indeholde:

`Weather Predictor / Aarhus Vejr by Ciroc0`

For data-, model- og snapshot-afledte værker bør attribution også nævne:

- `Uses weather data delivered via Open-Meteo`
- `Forecast source based on DMI HARMONIE`

## Covered paths

| Path | Licens |
| --- | --- |
| `LICENSE` | Apache-2.0 for kode |
| `NOTICE` | Bevares sammen med kodefordelinger |
| `README.md` | CC BY 4.0 |
| `docs/**` | CC BY 4.0 |
| `frontend/**` | Apache-2.0 |
| `scripts/**` | Apache-2.0 |
| `hf/spaces/**` | Apache-2.0 |
| `hf/datasets/**` | CC BY 4.0 |

## Platformmapping

### GitHub

- Root-repoet bør vise `Apache-2.0` via `LICENSE`
- README og denne fil forklarer de path-baserede undtagelser for docs og data

### Hugging Face Spaces

- Sæt repo-card metadata til `license: apache-2.0`
- README kan nævne `Ciroc0` som maintainer

### Hugging Face Datasets

- Sæt repo-card metadata til `license: cc-by-4.0`
- README skal beskrive attribution til projektforfatteren, Open-Meteo og DMI

## Bevidst begrænsning

Hvis du vil have "folk må bruge det som de vil" og samtidig bevare ophavsangivelsen, er en permissiv licens plus tydelig attribution/notice den mest realistiske open-source-model.

Hvis du på et senere tidspunkt vil kræve synlig branding i alle brugerinterfaces eller forbyde bestemte former for brug, bevæger du dig væk fra klassisk open source.
