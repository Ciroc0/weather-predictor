# 🤝 Bidrag til Aarhus Vejr

Tak for din interesse i at bidrage til Aarhus Vejr! Dette dokument guider dig gennem processen.

## 🎯 Projektets Fokus

Aarhus Vejr er et **Aarhus-specifikt** vejrprodukt. Vi prioriterer:

1. Nøjagtighed for Aarhus' lokale mikroklima
2. Klar sammenligning mellem DMI og ML-prognoser
3. Transparent performance-tracking

## 🐛 Fejlrapporter

Når du rapporterer en fejl, inkluder venligst:

- **Beskrivelse:** Hvad skete der?
- **Forventet:** Hvad forventede du?
- **Faktisk:** Hvad skete i stedet?
- **Reproduktion:** Trin for at genskabe
- **Miljø:** Browser, OS, tidspunkt
- **Screenshots:** Hvis relevant

## 💡 Feature Requests

Vi overvejer gerne nye features, men holder os til projektets scope:

- ✅ Forbedringer af nøjagtighed
- ✅ Bedre visualiseringer
- ✅ Yderligere vejrparametre
- ❌ Multi-city support (uden for scope)
- ❌ Kommercielle integrationer

## 🔧 Udviklingsopsætning

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Hugging Face Spaces

Spaces under `hf/` er separate repos. Se [docs/hf-git-commands.md](docs/hf-git-commands.md).

## 📝 Code Style

### TypeScript/React

- Brug **functional components** med hooks
- **Explicit types** frem for `any`
- **Named exports** frem for default exports
- **Consistent naming:** camelCase for variables, PascalCase for components

### Python (Spaces)

- Følg PEP 8
- Brug type hints hvor muligt
- Docstrings for public functions

### Commits

- Brug klare, beskrivende commit messages
- Prefix med område: `frontend:`, `collector:`, `trainer:`, `docs:`

Eksempler:
```
frontend: add wind gust visualization
collector: fix timezone handling in scheduler
docs: update API endpoint documentation
```

## 🧪 Testing

Før du åbner en PR:

1. **Frontend:** Kør `npm run lint` og `npm run build`
2. **TypeScript:** Ingen type errors (`tsc --noEmit`)
3. **Manuel test:** Verificer ændringer i browser

## 📋 Pull Request Process

1. Fork repoet og lav en feature branch
2. Commit dine ændringer med klare messages
3. Åbn en PR mod `main` branch
4. Beskriv hvad ændringen gør og hvorfor
5. Vent på review (typisk 1-3 dage)

## 🏷️ Licens

Ved at bidrage accepterer du at dine bidrag vil være under samme licens som projektet:

- **Kode:** Apache-2.0
- **Dokumentation/Data:** CC BY 4.0

## 💬 Spørgsmål?

- Åbn en [GitHub Issue](../../issues)
- Se eksisterende [dokumentation](docs/)

---

Tak for at bidrage til bedre vejrprognoser for Aarhus! 🌤️
