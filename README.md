# Nainital Tourism Vulnerability Dashboard

A dashboard that turns field-survey data from Nainital, Uttarakhand into a **Tourism Vulnerability
Index** and an interactive **peak-season stress/pressure test**, so overtourism pressure on water,
waste/sanitation, infrastructure, local livelihoods, and the host community becomes visible and
explorable — not just anecdotal.

## Background

The source data comes from the **Urban Immersion program**, TISS BS Analytics & Sustainability
Studies (2024–28 batch), which ran 5 field surveys in Nainital:

| Survey | Respondents | Captures |
|---|---|---|
| Enterprise | 157 | Hotels, restaurants, shops — water/waste/energy/labour practices |
| Location (site audit) | 10 zones | Physical infrastructure at fixed GPS points across town |
| Tourist | 320 | Visitor experience, spend, satisfaction |
| Local Residents | 239 | Household water/sanitation, livelihood, perceived crowding/noise/price strain |
| Workers | 303 | Tourism-sector employment, income seasonality, precarity |

Raw files live in `survey_data/` (KoBoToolbox exports, labeled).

## What the dashboard shows

- **Tourism Vulnerability Index (TVI)** — a 0–100 composite score, town-wide and per zone, built
  from six pillars: water stress, waste & sanitation pressure, infrastructure adequacy, economic
  dependency/precarity, socio-cultural pressure, and visitor experience.
- **Peak-season stress test** — a "what if tourist footfall rises by X%" simulator that recomputes
  water, waste, and livelihood pressure under a higher-load scenario, with the assumptions shown,
  not hidden.
- **Zone map** — the 10 surveyed sites plotted with per-zone scores, enriched with OpenStreetMap
  points of interest (parking, toilets, dustbins, healthcare) around each site.
- **Explorer** — drill into the derived variables behind any pillar.
- **AI chat** — ask questions about the dashboard's own numbers; answers are grounded in the
  computed indices, not generic tourism facts.

Full variable list (raw / derived / composite) and every external data source (OSM, Open-Meteo,
Census, tourism-department stats, etc.) is in
**[`VARIABLES_AND_DATA_SOURCES.md`](./VARIABLES_AND_DATA_SOURCES.md)**.

Pipeline design, index methodology, stress-test assumptions, and the phased build plan are in
**[`workflow.md`](./workflow.md)**.

## Tech stack (planned)

- **Backend**: FastAPI (Python), serving processed indices + a stress-test scenario endpoint + an
  AI chat route (Groq).
- **Frontend**: plain HTML/CSS/JS, GSAP for animation/transitions, a chart library for
  gauges/bars/lines, and a Leaflet/MapLibre map (OSM tiles) for the zone view.
- **Data prep**: pandas-based cleaning/harmonization/index-computation pipeline, run offline, output
  cached so the live dashboard never re-processes raw Excel files per request.

## Status

**Planning phase.** `workflow.md` and `VARIABLES_AND_DATA_SOURCES.md` lay out the full plan for
review. Implementation proceeds phase by phase (see `workflow.md` §10) once the plan is confirmed:
data pipeline → backend → frontend → stress-test UI → animation pass → AI chat.

## Repo structure

```
survey_data/                     raw KoBoToolbox survey exports (source of truth, do not edit)
VARIABLES_AND_DATA_SOURCES.md    full data dictionary: raw/derived/composite variables + external sources
workflow.md                      pipeline architecture, index methodology, build plan
# planned, not yet created:
reference_data/                  static external reference tables (population, tourist stats, etc.)
backend/                         FastAPI app, data pipeline, processed data store
frontend/                        HTML/CSS/JS + GSAP dashboard
```
