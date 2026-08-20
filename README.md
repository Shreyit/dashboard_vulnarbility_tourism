# Nainital Tourism Vulnerability Dashboard

A dashboard that turns field-survey data from Nainital, Uttarakhand into a **Tourism Vulnerability
Index** and an interactive **peak-season stress/pressure test**, so overtourism pressure on water,
waste/sanitation, infrastructure, local livelihoods, and the host community becomes visible and
explorable, not just anecdotal.

## Background

The source data comes from the **Urban Immersion program**, TISS BS Analytics & Sustainability
Studies (2024–28 batch), which ran 5 field surveys in Nainital:

| Survey | Respondents | Captures |
|---|---|---|
| Enterprise | 157 | Hotels, restaurants, shops: water/waste/energy/labour practices |
| Location (site audit) | 10 zones | Physical infrastructure at fixed GPS points across town |
| Tourist | 320 | Visitor experience, spend, satisfaction |
| Local Residents | 239 | Household water/sanitation, livelihood, perceived crowding/noise/price strain |
| Workers | 303 | Tourism-sector employment, income seasonality, precarity |

Raw files live in `survey_data/` (KoBoToolbox exports, labeled).

## What the dashboard shows

- **Tourism Vulnerability Index (TVI)**: a 0-100 composite score, town-wide and per zone, built
  from six pillars: water stress, waste & sanitation pressure, infrastructure adequacy, economic
  dependency/precarity, socio-cultural pressure, and visitor experience.
- **Peak-season stress test**: a "what if tourist footfall rises by X%" simulator that recomputes
  water, waste, and livelihood pressure under a higher-load scenario, with the assumptions shown,
  not hidden.
- **Zone map**: the 10 surveyed sites plotted with per-zone scores, enriched with OpenStreetMap
  points of interest (parking, toilets, dustbins, healthcare) around each site.
- **Explorer**: drill into the derived variables behind any pillar.
- **PahadiBot**: the dashboard's AI chat assistant. Ask it about the dashboard's own numbers;
  answers are grounded in the computed indices, not generic tourism facts.

Full variable list (raw / derived / composite) and every external data source (OSM, Open-Meteo,
Census, tourism-department stats, etc.) is in
**[`VARIABLES_AND_DATA_SOURCES.md`](./VARIABLES_AND_DATA_SOURCES.md)**.

Pipeline design, index methodology, stress-test assumptions, the visual-design rules, and the
phased build plan are in **[`workflow.md`](./workflow.md)**.

The established tourism-carrying-capacity/vulnerability research (UNWTO, Sphere, Falkenmark, GSTC,
Doxey's Irridex, OECD/JRC composite-indicator methodology, Nainital's own NGT-directed carrying
capacity assessment, etc.) used to ground the indices, with citations and honest notes on which
numbers are directly applicable vs. context-only, is in
**[`RESEARCH_BENCHMARKS.md`](./RESEARCH_BENCHMARKS.md)**.

The data-cleaning and exploratory analysis notebook (harmonizes KoBo form-versioning artifacts,
drops dead/empty columns, filters bad GPS points, assigns records to zones, and runs first-pass EDA)
is **[`notebooks/01_data_cleaning_eda.ipynb`](./notebooks/01_data_cleaning_eda.ipynb)**; its cleaned
output tables land in `processed/`.

## Tech stack

- **Backend** (v1 built): FastAPI (Python), serving processed indices + a stress-test scenario
  endpoint + PahadiBot's chat route (Groq, not yet keyed).
- **Frontend** (scaffolded): React + TypeScript, built with Vite. Client-side SPA, GSAP-driven
  animation, real photography processed into duotone art, a deliberately narrow warm-white/grey/
  terracotta palette with no dark mode. See `workflow.md` §9.1 for the full visual-language rules.
- **Data prep**: pandas-based cleaning/harmonization/index-computation pipeline, run offline, output
  cached so the live dashboard never re-processes raw Excel files per request.

## Status

**Data pipeline, backend v1, and frontend design system are done; wiring the frontend views to
the live API is next.**

- `notebooks/01_data_cleaning_eda.ipynb`: done, cleaned tables in `processed/`.
- `backend/`: FastAPI app is live -- loads `processed/*.csv`, derives every variable in
  `VARIABLES_AND_DATA_SOURCES.md` §3, computes the 6 sub-indices + TVI (town-wide and per-zone)
  and the peak-season stress-test scenario per `workflow.md` §5-§6. Routes: `/api/zones`,
  `/api/indices/town`, `/api/indices/zone/{zone_id}`, `/api/variables/{theme}`,
  `/api/stress-test`, `/api/chat` (PahadiBot -- replies that it isn't connected yet until a
  `GROQ_API_KEY` is set in `backend/.env`). External enrichment (OSM/Open-Meteo, `workflow.md`
  §4) and zone-name confirmation are still open; weights in `backend/app/weights.json` are
  equal-default and the first thing to hand back to domain reviewers.
- `frontend/`: design system, custom cursor, pixel-transition reveal, flowing-menu nav, and dome
  photo gallery are built and live on a landing page. The actual data views (Overview, Zone Map,
  Stress Test, Explorer, PahadiBot chat) are placeholders until wired to the backend above.

See `workflow.md` §10 for the full phased plan.

## Running it

```
# backend (FastAPI)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010   # http://localhost:8010/docs

# frontend (design system + landing page)
cd frontend
npm install
npm run dev        # http://localhost:5173

# notebook (data cleaning + EDA)
cd notebooks
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter notebook 01_data_cleaning_eda.ipynb
```

## Repo structure

```
survey_data/                     raw KoBoToolbox survey exports (source of truth, do not edit)
notebooks/01_data_cleaning_eda.ipynb   cleaning + EDA notebook (run this to regenerate processed/)
notebooks/requirements.txt       python deps for the notebook (pandas, numpy, matplotlib, openpyxl, jupyter)
processed/                       cleaned per-survey CSVs + data_quality_report.csv (notebook output)
frontend/                        React + TypeScript (Vite) dashboard, GSAP animation, design system
backend/                         FastAPI app: derives indices from processed/, serves the API
VARIABLES_AND_DATA_SOURCES.md    full data dictionary: raw/derived/composite variables + external sources
workflow.md                      pipeline architecture, index methodology, visual language, build plan
RESEARCH_BENCHMARKS.md           cited external research: metrics/thresholds/frameworks behind the indices
# planned, not yet created:
reference_data/                  static external reference tables (population, tourist stats, etc.)
```
