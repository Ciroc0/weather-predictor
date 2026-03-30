# 🌤️ Aarhus Vejr Frontend

> React 19 + TypeScript + Vite + Tailwind CSS

Frontend-applikationen for Aarhus Vejr – en vejrprognose-tjeneste der sammenligner DMI's prognoser med lokale ML-korrektioner.

## 🚀 Quick Start

```bash
# Installer dependencies
npm install

# Kør udviklingsserver
npm run dev

# Byg til produktion
npm run build

# Preview produktionsbuild
npm run preview

# Lint check
npm run lint
```

## 📁 Projektstruktur

```
frontend/
├── public/              # Statiske filer
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/      # React komponenter
│   │   ├── ui/         # shadcn/ui komponenter
│   │   └── weather/    # Vejrspecifikke komponenter
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities & API
│   ├── pages/          # Route-komponenter
│   └── types/          # TypeScript typer
├── api/                # Vercel serverless functions
│   └── dashboard.js    # API endpoint
└── ...config filer
```

## 🛠️ Teknologi Stack

- **[React 19](https://react.dev/)** – UI framework
- **[TypeScript](https://www.typescriptlang.org/)** – Type safety
- **[Vite](https://vitejs.dev/)** – Build tool
- **[Tailwind CSS](https://tailwindcss.com/)** – Styling
- **[shadcn/ui](https://ui.shadcn.com/)** – UI komponenter
- **[React Router](https://reactrouter.com/)** – Routing
- **[TanStack Query](https://tanstack.com/query)** – Data fetching
- **[Recharts](https://recharts.org/)** – Grafer og charts
- **[Framer Motion](https://www.framer.com/motion/)** – Animationer

## 📡 Data Flow

1. **Dashboard API** (`/api/dashboard.js`) henter data fra Hugging Face
2. **Primær kilde:** `frontend_snapshot.json` fra predictions dataset
3. **Fallback:** Hugging Face dataset-server API
4. **Caching:** 5-minutters client-side cache med TanStack Query

## 🎨 Design System

Applikationen bruger et custom theme baseret på shadcn/ui med:

- **Primær farve:** Teal (vejr/temperatur tema)
- **Sekundær farve:** Blå (DMI reference)
- **Accent:** Orange (ML forbedringer)

### Nøgle-komponenter

| Komponent | Beskrivelse |
|-----------|-------------|
| `WeatherHero` | Hero sektion med aktuelt vejr |
| `TemperatureTab` | Temperaturprognoser og historik |
| `WindTab` | Vind og vindstød visualisering |
| `RainTab` | Regnforudsigelser |
| `PerformanceTab` | ML vs DMI performance metrics |

## 🔧 Konfiguration

Miljøvariabler (`.env`):

```env
# HF Token er påkrævet for API-kald til private datasets
HF_TOKEN=your_huggingface_token
```

## 📝 Routes

| Route | Komponent | Beskrivelse |
|-------|-----------|-------------|
| `/` | `HomePage` | Oversigt og aktuelt vejr |
| `/temperature` | `TemperaturePage` | Temperatur detaljer |
| `/wind` | `WindPage` | Vind detaljer |
| `/rain` | `RainPage` | Regn detaljer |
| `/performance` | `PerformancePage` | Model performance |

## 🌐 SEO

- **Sitemap:** Auto-genereret ved build
- **Robots.txt:** Tillader indexing
- **Meta tags:** Dynamiske baseret på route
- **Breadcrumbs:** Struktureret data for Google

## 🚀 Deployment

Frontenden deployes automatisk til **Vercel** ved push til main branch.

```bash
# Manuel deploy
vercel --prod
```

---

Se [root README](../README.md) for projekt-overblik og [docs/system-context.md](../docs/system-context.md) for fuld arkitektur.
