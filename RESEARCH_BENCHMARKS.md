# Research Benchmarks — Metrics, Thresholds & Frameworks

Established tourism-carrying-capacity, water/sanitation, labour, and composite-indicator research
used to ground the dashboard's indices, so pillar scores aren't arbitrary. Each entry states what
it is, the number/threshold (if any), **whether it's directly applicable to our variables or
context-only**, and where it's used. Everything here is cited — nothing below is invented; where no
verified Nainital-specific or hospitality-specific number exists, that gap is stated explicitly
rather than filled with a guess.

## 1. Directly applicable — used numerically

### 1.1 Nainital Tourist Carrying Capacity (empirical anchor)
- Nainital has road capacity for roughly **3,000 vehicles**; **3,000–4,000 tourist vehicles/day**
  enter during peak season, and on **peak summer weekends up to ~50,000 vehicles** attempt entry.
- Following an NGT directive (Sept 2024), Uttarakhand launched a district-wide **Tourist Carrying
  Capacity (TCC)** assessment for Nainital district (announced July 2025) — the first such
  state-led assessment in India, explicitly to classify environmental sensitivity vs anthropogenic
  stress capacity.
- **Use**: this is our best real-world anchor for the **Peak-Season Stress Multiplier (PSSM)** —
  e.g., "current peak inflow is already ~1.0–1.3× road capacity; a further +25% pushes it to ~1.6×"
  reads as a concrete, sourced claim rather than an arbitrary slider.
- Source: [Uttarakhand Pioneers 'Tourist Carrying Capacity' Assessment in Nainital District](https://politicalsciencesolution.com/uttarakhand-pioneers-tourist-carrying-capacity-assessment-in-nainital-district-to-ensure-sustainable-tourism/), [Vision IAS — In a first, Uttarakhand to assess 'Tourist Carrying Capacity'](https://visionias.in/current-affairs/news-today/2025-07-28/environment/in-a-first-uttarakhand-to-assess-tourist-carrying-capacity-in-nainital-district), [Himalayan Geographic — Himalayan overtourism crisis](https://himalayangeographic.com/himalayan-overtourism/)

### 1.2 Sphere Standards — sanitation ratio
- **< 20 users per toilet** is the (emergency-response) minimum sanitation ratio; **15 L/person/day**
  is the emergency minimum water allowance (7.5 L/day acceptable only briefly in acute drought).
- **Use**: applied as a stress-test check against `zone_toilet_count` vs. an estimated peak-day
  footfall per zone (from `accommodation_unit_count` × an assumed occupancy, clearly labeled as
  approximate). This is a *humanitarian floor*, not a tourism-comfort standard — a zone passing it
  is not "adequate," only "not in crisis." Framed that way in the notebook, not oversold.
- Source: [WHO — Technical notes on drinking-water, sanitation and hygiene in emergencies](https://cdn.who.int/media/docs/default-source/wash-documents/who-tn-09-how-much-water-is-needed.pdf), [Sphere Handbook — WASH minimum standards](https://ksrpmi.uns.ac.id/wp-content/uploads/2019/09/Sphere-Handbook-2018-WATER-SUPPLY.pdf)

### 1.3 OECD/JRC Handbook on Constructing Composite Indicators (2008)
- The reference methodology for building composite indices: 10 steps from theoretical framework →
  data selection → **normalization** (min-max, z-score, distance-to-reference — min-max is common
  but outlier-sensitive, so clip extremes first) → **weighting** (equal, PCA/factor analysis, AHP,
  budget allocation) → **aggregation** (linear/geometric/multi-criteria) → robustness/sensitivity
  analysis.
- **Use**: this is the methodological basis for `workflow.md` §5 (normalize → direction-align →
  weight → aggregate). It's why we clip at the 1st/99th percentile before min-max scaling, and why
  weights live in one editable config rather than being hardcoded.
- Source: [OECD/JRC — Handbook on Constructing Composite Indicators: Methodology and User Guide](https://www.oecd.org/content/dam/oecd/en/publications/reports/2008/08/handbook-on-constructing-composite-indicators-methodology-and-user-guide_g1gh9301/9789264043466-en.pdf)

## 2. Framework references — shape *what we measure*, not a hard number

### 2.1 UNWTO / European Parliament — overtourism definition
- UNWTO: overtourism is tourism's impact "excessively influenc[ing] perceived quality of life of
  citizens and/or quality of visitors' experiences in a negative way." European Parliament (TRAN
  committee): impact exceeding **physical, ecological, social, economic, psychological, and/or
  political capacity thresholds**.
- **Use**: this multi-dimensional framing is why the dashboard doesn't collapse everything into one
  "tourist count" metric — it's the justification for having 6 separate pillars (water, waste,
  infra, economic, socio-cultural, visitor experience) rather than a single density number.
- Source: [UNWTO — 'Overtourism'? Understanding and Managing Urban Tourism Growth](https://www.e-unwto.org/doi/pdf/10.18111/9789284420070)

### 2.2 ESPON Carrying Capacity Methodology
- Pairs **tourism exposure indicators** with **territorial sensitivity indicators** in a
  destination-tailored (not one-size-fits-all) process.
- **Use**: conceptually validates our zone-level approach (each of the 9 zones can have different
  sensitivity even under similar tourist exposure) rather than a single town-wide number only.
- Source: [ESPON — Carrying capacity methodology for tourism: Targeted Analysis](https://archive.espon.eu/sites/default/files/attachments/Tourism_methodology-handbook.pdf)

### 2.3 Doxey's Irridex (1975)
- Four qualitative stages of host-community sentiment as tourism grows: **Euphoria → Apathy →
  Irritation → Antagonism**.
- **Use**: implemented directly as the **Host-Visitor Perception Gap (HVG)**'s `doxey_stage`
  (`backend/app/insights.py::_doxey_stage`, `VARIABLES_AND_DATA_SOURCES.md` §4.1) — `1 − SCPI`
  (host sentiment) is banded into the four stages (≥0.75 Euphoria, ≥0.5 Apathy, ≥0.25 Irritation,
  else Antagonism), then compared against tourists' own `overall_satisfaction`. The bands are our
  own threshold choice (Doxey's original is qualitative, not numeric), stated as such rather than
  presented as a validated cutoff.
- Source: [Irritation Index, tourism — Springer](https://link.springer.com/rwe/10.1007/978-3-319-01669-6_564-1), [Tourism Teacher — Doxey's Irritation Index](https://tourismteacher.com/doxeys-irritation-index/)

### 2.4 GSTC Destination Criteria v2.0
- Global Sustainable Tourism Council's destination standard: **4 pillars** (sustainable management,
  socio-economic impacts, cultural impacts, environmental impacts), **38 criteria / 174 indicators**,
  each mapped to relevant SDGs.
- **Use**: cross-check — our 6 pillars collapse cleanly onto GSTC's 4 (water+waste+infra ≈
  environmental/management; economic dependency ≈ socio-economic; socio-cultural pressure ≈
  cultural+socio-economic; visitor experience ≈ management) — i.e., we're not missing a
  internationally-recognized dimension, just organizing it differently for this dataset.
- Source: [GSTC Destination Criteria v2.0 (Dec 2019)](https://www.gstc.org/wp-content/uploads/GSTC-Destination-Criteria-v2.0.pdf)

### 2.5 ILO — informality & decent work
- Decent-work indicators cover income security, social protection, and workplace rights; informal
  tourism work is characterized by **fluctuating income, weak/no social protection, and
  seasonality**.
- **Use**: directly justifies the Economic Dependency & Precarity Index's components
  (`worker_has_insurance`, `worker_paid_on_time`, `worker_employment_status`,
  `worker_months_employed_last_year`) as internationally recognized precarity markers, not
  arbitrarily chosen survey questions.
- Source: [ILOSTAT — Decent Work Reality Check: Informality Across the World of Work](https://ilostat.ilo.org/blog/decent-work-reality-check-informality-is-everywhere/), [ILO — Decent Work Indicators Guidelines](https://www.ilo.org/sites/default/files/wcmsp5/groups/public/@dgreports/@integration/documents/publication/wcms_229374.pdf)

### 2.6 Triple Bottom Line (Elkington, 1997)
- The standard Economic / Social / Environmental sustainability triad, popularized as the "three
  pillars" or "3 Ps" (People, Planet, Profit) framework for measuring organizational and destination
  sustainability, not just financial performance.
- **Use**: regroups our 6 pillars into the three dimensions for the dashboard's Sustainability
  Triad (Coxcomb chart) — `economic = EDPI`; `environmental = mean(WSI, WSPI, 1−IAI)`;
  `social = mean(SCPI, 1−VEI)`. This grouping is our own interpretive choice (infrastructure
  adequacy is treated as part of the physical/environmental capacity dimension, following the
  Boullón/UNWTO physical-ecological carrying-capacity tradition, rather than as a fourth
  "institutional" pillar some frameworks use); it is corroborated, not contradicted, by the GSTC
  4-pillar crosswalk in §2.4.
- Source: Elkington, J. (1997). *Cannibals with Forks: The Triple Bottom Line of 21st Century
  Business*. Capstone Publishing. (Bibliographic reference — no URL cited here; unlike the other
  sources in this file, deliberately not linked to avoid citing an unverified web address for a
  1997 print book.)

### 2.7 Social Exchange Theory (Ap, 1992)
- Residents who perceive themselves as benefiting from tourism (economically or otherwise) tend to
  evaluate its costs more favorably, and vice versa — a widely used lens in tourism-impact-perception
  research for explaining why host-community attitudes vary even under similar objective tourism
  pressure.
- **Use**: frames the dashboard's Resident Attitudes tab — a fresh Mann-Whitney U comparison of
  tourism-dependent vs. non-dependent residents across Economic/Social/Environmental attitude
  pillars (`backend/app/resident_attitudes.py`, `VARIABLES_AND_DATA_SOURCES.md` §4.3). Prompted by a
  pasted research narrative reporting a related finding on a different pillar-item bundle we can't
  reproduce here; this implements the same *kind* of test on our own data, not that exact result.
- Source: Ap, J. (1992). Residents' Perceptions Research on the Social Exchange Theory. *Annals of
  Tourism Research*, 19(4), 665-690. (Bibliographic reference — no URL cited, same treatment as the
  Elkington 1997 entry above.)

## 3. Context-only — real thresholds, but the wrong unit/scale for our data (stated, not applied)

### 3.1 Falkenmark Water Stress Indicator
- National-scale thresholds: **< 1,700 m³/capita/year = water stress**, **< 1,000 = scarcity**,
  **< 500 = absolute scarcity** — a country-level renewable-freshwater metric.
- **Why context-only**: our water data is household/enterprise **hours-of-supply and litres/day**,
  not national renewable-water-per-capita. Applying the Falkenmark cutoff directly would be a unit
  mismatch. Kept here only to show the concept of a globally-recognized water-stress threshold
  exists — our WSI uses relative (min-max, zone-vs-zone) scoring instead, per OECD/JRC guidance.
- Source: [Global Water Forum — Understanding water scarcity: definitions and measurements](https://globalwaterforum.org/2012/05/07/understanding-water-scarcity-definitions-and-measurements/)

### 3.2 WHO/JMP domestic water ladder
- **50–100 L/person/day** is WHO's estimate of what's needed to meet basic drinking, cooking, and
  hygiene needs with few health concerns (above the Sphere emergency floor of 15 L/day).
- **Why context-only**: our survey captures **hours of piped supply**, not litres consumed per
  resident — we don't have the litres/person/day figure to compare directly. Noted as a **data-gap
  flag**: if a future survey round adds per-capita litre estimates, this becomes directly
  applicable.
- Source: [UNICEF — SDG briefing note: drinking water](https://data.unicef.org/wp-content/uploads/2018/04/SDG-briefing-note-11_drinking-water.pdf)

### 3.3 Municipal solid waste generation, India
- National average **~0.57 kg/person/day**; tourist hill towns (Leh, Panaji, Kodaikanal, Dharamsala,
  Gangtok) run well above the general 0.3–0.5 kg/day/person baseline, with absolute tonnages
  (Kodaikanal 19–25 t/day, Dharamsala ~14 t/day, Gangtok ~50 t/day) reported in case studies.
- **Why context-only**: no verified **per-tourist** (as opposed to per-resident or town-total)
  coefficient was found for a Nainital-comparable hill town — cited qualitatively (tourist hill
  towns generate disproportionately more waste than the national average) rather than as a number
  to plug into WSPI.
- Source: [NITI Aayog — Waste-Wise Cities](https://www.niti.gov.in/sites/default/files/2021-12/Waste-Wise-Cities.pdf), [Mongabay India — Hill station waste needs better plan](https://india.mongabay.com/2023/09/hill-station-waste-needs-better-plan-not-just-plastic-ban/), [World Bank — Sustainable Solid Waste Management in Mountain Areas](https://documents1.worldbank.org/curated/en/823241618991659221/pdf/India-Sustainable-Solid-Waste-Management-in-Mountain-Areas.pdf)

## 4. Himalayan/mountain-tourism vulnerability methodology

- A Shimla-district (Himachal Pradesh) tourism vulnerability study used **18 indicators** grouped
  into **Exposure** (natural hazard, NDVI, elevation, slope, tourism demand, land use),
  **Sensitivity** (population density, GSDP, marginal workers, forest area, water availability), and
  **Adaptive Capacity** (medical facilities, road density, accommodation, telecom, electricity),
  weighted via **Analytic Hierarchy Process (AHP)** pairwise comparison.
- **Use**: this Exposure–Sensitivity–Adaptive Capacity (E-S-AC) structure is a well-established
  alternative framing to our 6-pillar TVI. **Implemented as a second, complementary lens**
  (`backend/app/framework_esac.py`, dashboard tab "E-S-AC"), not a replacement for the TVI — our
  version reuses this pipeline's own already-derived columns rather than the Shimla study's original
  NDVI/slope/land-use/AHP-weighted inputs (we don't have those layers), so it's a reimplementation of
  the *structure*, not the original study's exact indicators or weights. Every substitution is
  documented in `VARIABLES_AND_DATA_SOURCES.md` §4.2.
- Source: [Assessing and Mapping Tourism Vulnerability Using Remote Sensing — Shimla District case](https://link.springer.com/chapter/10.1007/978-981-95-0156-4_11)

## 5. How this feeds the dashboard

- §1 items are used as **numeric anchors** in the cleaning/EDA notebook and later in the
  stress-test module.
- §2 items justify **why the pillars/sub-components are what they are**.
- §3 items are recorded so the reasoning is transparent, but are **not** silently baked into a
  score — better to say "no verified benchmark for this" than fabricate one.
- §4 is an **open design option** for the user to accept or decline before/while we build the index
  computation stage.
