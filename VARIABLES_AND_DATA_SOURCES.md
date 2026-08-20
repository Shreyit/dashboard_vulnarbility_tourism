# Variables & Data Sources — Nainital Tourism Vulnerability Dashboard

This is the data dictionary for the dashboard. It lists every variable we plan to use, grouped by
**theme (pillar)**, and split into **raw** (straight from the surveys), **derived** (engineered
from one or more raw fields), and **composite** (indices built from derived variables). It also
lists the **external/public data** (OSM, climate, elevation, population, etc.) we'll enrich the
survey data with.

> Source data: 5 KoBoToolbox surveys under `survey_data/`, collected by TISS BS Analytics &
> Sustainability Studies (2024–28) students in Nainital, Uttarakhand:
>
> | Survey | File | Respondents | Unit of analysis |
> |---|---|---|---|
> | Enterprise | `Enterprise_Urban_Immersion_...xlsx` | 157 | Business (hotel/restaurant/shop/etc.) |
> | Location (site audit) | `Location_Urban_Immersion_...xlsx` | 10 | Physical zone/site in Nainital |
> | Tourist | `Tourist_Urban_Immersion_...xlsx` | 320 | Visitor |
> | Local Residents | `Urban_Immersion-Local_Residents_...xlsx` | 239 | Household |
> | Workers | `Workers_Urban_Immersion_...xlsx` | 303 | Tourism-sector worker |

We will **not** use every one of the ~90–99 columns per file. Columns below are the ones selected
for v1. Everything else (open-text "other, specify" fields, near-duplicate re-asked questions from
older form versions, metadata like `_uuid`/`_submission_time`) is parked — see `workflow.md` §2 for
the harmonization rules.

---

## 1. Themes (pillars) driving the dashboard

1. **Water Stress & Resource Pressure**
2. **Waste, Sanitation & Sewage Pressure**
3. **Infrastructure & Mobility Adequacy**
4. **Economic Dependency & Livelihood Precarity**
5. **Socio-Cultural & Host-Community Pressure**
6. **Visitor Experience & Service Quality** (an inverse signal — poor experience often co-occurs with strained infrastructure)

These six feed the two headline dashboard views the user asked for: the **Tourism Vulnerability
Index (TVI)** and the **Peak-Season Stress/Pressure Test**.

---

## 2. Raw variables (selected, by theme)

### 2.1 Water Stress
| Variable | Source survey | Column (label) | Type |
|---|---|---|---|
| `water_source_primary` | Enterprise | "What's the primary source of your establishment's water supply?" | categorical |
| `water_hours_supply` | Enterprise | "How many hours a day do you receive water supply?" | numeric |
| `water_storage_capacity_l` | Enterprise | "What is the storage tanks capacity? (in litres)" | numeric |
| `water_daily_consumption_l` | Enterprise | "How much water is consumed in a day (in litres)?" | numeric |
| `water_shortage_days_month` | Enterprise | "How many days in a month do you face water shortage?" | numeric |
| `water_shortage_worse_peak` | Enterprise | "Is water shortage worse during peak season?" | categorical |
| `water_constraint_limits_ops` | Enterprise | "During peak season, have water constraints affected your ability to operate at full capacity?" | boolean |
| `has_rainwater_harvesting` | Enterprise | "Does your enterprise have a rainwater harvesting system?" | boolean |
| `elec_bill_peak` / `elec_bill_offpeak` | Enterprise | "average monthly electricity bill" (peak/off season) | numeric |
| `hh_water_source` | Local Residents | "Where does your household primarily get its drinking water from?" | categorical (multi) |
| `hh_water_hours_supply` | Local Residents | "How many hours per day does your household typically receive piped water supply?" | numeric |
| `hh_water_coping` | Local Residents | "How does your household cope during periods of water shortage?" | categorical (multi) |
| `hh_bought_tanker_water` | Local Residents | "Have you ever had to buy packaged water or hire a private tanker due to shortage?" | boolean |
| `hh_water_priority_perception` | Local Residents | "Do you feel local residents' water needs are prioritized vs hotels/tourism?" | categorical |
| `hh_water_trend_5yr` | Local Residents | "How has water availability changed in your locality over the past five years?" | categorical (ordinal) |
| `hh_rainwater_harvesting` | Local Residents | "Does your household have a rainwater harvesting system?" | boolean |

### 2.2 Waste, Sanitation & Sewage
| Variable | Source survey | Column (label) | Type |
|---|---|---|---|
| `has_dustbins` | Enterprise | "Does your enterprise have dustbins for waste collection?" | boolean |
| `waste_mgmt_peak_method` | Enterprise | "During tourist season, as waste generation increases, how do you manage it?" | categorical |
| `waste_segregates_dry_wet` | Enterprise | "Does your hotel separate dry and wet waste?" | boolean |
| `waste_collection_freq_peak/off` | Enterprise | "Frequency of waste collection during Peak/Off Season" | categorical |
| `sewage_system_type` | Enterprise | "How does your establishment manage sewage?" (municipal/septic/own STP/none) | categorical (multi) |
| `sanitation_expense_yearly` | Enterprise | "Yearly Sanitation Expenses" | numeric |
| `hh_sewage_system_type` | Local Residents | "What is the Sewage System of your house?" | categorical |
| `hh_sewage_overflow_peak` | Local Residents | "Do you experience sewage overflow or sanitation problems during peak season?" | boolean |
| `zone_dustbin_count` | Location | "How many dustbins" / "Total number of dustbins in the zone" (merge versions) | numeric |
| `zone_dustbin_condition` | Location | "Condition of Dustbins" | categorical |
| `zone_toilet_count` | Location | "How many public toilets are there in the zone" | numeric |
| `zone_toilet_has_soap_water` | Location | "Availability of Soap" / "Availability of Water" | boolean |
| `tourist_dustbin_adequacy_perception` | Tourist | "Do you feel there are enough dustbins in the areas you have visited?" | categorical |
| `tourist_cleanliness_rating` | Tourist | "How would you rate the cleanliness of the areas you have visited?" (1–5) | ordinal |

### 2.3 Infrastructure & Mobility (zone-level, Location survey)
| Variable | Column (label) |
|---|---|
| `emergency_response_time_min` | "Time taken by ambulance/fire services to reach critical points (mins)" |
| `shared_transport_modes` | "Availability of shared transport services..." (e-rickshaw/auto/cab) |
| `parking_spots_hotel` / `parking_spots_public` | "Number of hotel based parking spots" / "Number of public parking spots" |
| `has_footpaths` | "Are there dedicated footpaths?" |
| `street_light_count` | "Number of street lights" |
| `is_disability_friendly` | "Is the tourism infrastructure disable friendly?" |
| `has_potholes` | "Are there any potholes on the road?" |
| `has_waterlogging` | "Is there water logging on the road?" |
| `signboard_count` / `multilingual_signboard_count` | directional & multilingual signage counts |
| `info_displayed_rules/env/emergency/evacuation` | boolean flags for each info type displayed |
| `tourist_info_centres_public/private` | counts |
| `has_public_wifi` | boolean |
| `telecom_providers_available` | categorical (multi) |
| `internet_speed_up/down` | numeric |
| `healthcare_available` | boolean |
| `accommodation_unit_count` | "Total number of registered accommodation units in the area" |
| `tourist_ease_of_navigation` | Tourist: "How easy was it to find directions to tourist attractions?" (1–5) |
| `tourist_signage_sufficiency` | Tourist: "Were signboards and information boards useful/sufficient?" (1–5) |

### 2.4 Economic Dependency & Livelihood Precarity
| Variable | Source survey | Column (label) |
|---|---|---|
| `worker_income_peak` / `worker_income_offpeak` | Workers | "approximate monthly income during peak/off-season" |
| `worker_tourism_income_share` | Workers | "share of total annual income from tourism-related activities" |
| `worker_months_employed_last_year` | Workers | "For how many months in the previous year you received work?" |
| `worker_employment_status` | Workers | "Status of employment" |
| `worker_has_insurance` | Workers | "Do you have access to any health insurance or accident coverage?" |
| `worker_receives_training` | Workers | "Have you received any training for employment?" |
| `worker_gov_support` | Workers | "Do you receive any government or institutional support?" |
| `worker_paid_on_time` | Workers | "Do you receive your payment on time?" |
| `hh_tourism_primary_livelihood` | Local Residents | "Is tourism primary source of livelihood for your family?" |
| `hh_tourism_income` | Local Residents | "If yes, how much do you earn from tourism?" |
| `hh_other_income_source` | Local Residents | "Do you have any other source of income besides tourism?" |
| `enterprise_ft_employees` / `seasonal_employees` | Enterprise | full-time vs seasonal/temporary employee counts |
| `enterprise_local_employee_share` | Enterprise (derived from) | "employees that are residents of Nainital District" ÷ total employees |
| `enterprise_gov_support_offseason` | Enterprise | "Do you receive gov/institutional support during off-season?" |

### 2.5 Socio-Cultural & Host-Community Pressure
| Variable | Source survey | Column (label) |
|---|---|---|
| `hh_avoids_crowded_areas_peak` | Local Residents | "During peak season, do you visit Mall Road/Naini Lake as often?" |
| `hh_avoidance_reason` | Local Residents | "If not, why?" (crowded/traffic/noise/prices/atmosphere) |
| `hh_travel_difficulty_peak` | Local Residents | "How would you describe travelling within Nainital during peak season?" |
| `hh_price_inflation_perception` | Local Residents | "How do prices of daily goods compare, tourist vs off-season?" |
| `hh_noise_perception_peak` | Local Residents | "How would you describe noise levels during tourist season vs rest of year?" |
| `hh_environment_trend_5yr` | Local Residents | "How has the condition of Nainital's environment changed over 5 years?" |
| `hh_tourist_behavior_perception` | Local Residents | "How do tourists conduct themselves w.r.t. local customs?" |
| `hh_tourism_net_benefit_view` | Local Residents | "Do you think tourism has helped Nainital grow and develop?" |
| `enterprise_promotes_local_culture` | Enterprise | "Do you actively promote Kumaoni culture/cuisine to tourists?" |
| `enterprise_child_labour_observed` | Enterprise | "Do you observe presence of Child Labour in the Enterprise?" |

### 2.6 Visitor Experience & Service Quality
| Variable | Source survey | Column (label) |
|---|---|---|
| `tourist_overall_satisfaction` | Tourist | "Overall, how satisfied are you with your experience?" (1–5; merge versioned duplicate column) |
| `tourist_over_budget` | Tourist | "Have you gone beyond your expected budget for the trip?" |
| `tourist_challenges_faced` | Tourist | "What are the challenges faced by you in your visit?" (open/categorical) |
| `tourist_amenities_used` | Tourist | public toilets / drinking water / seating / dustbins used |
| `tourist_spend_total` | Tourist | "Approximate total expenditure during this visit" |
| `tourist_length_of_stay` | Tourist | "Length of your stay" |
| `tourist_repeat_visit` | Tourist | "Is this your first visit to Nainital?" |
| `tourist_purchased_local_products` | Tourist | "Have you purchased local products/handicrafts/souvenirs?" |

---

## 3. Derived variables (engineered)

| Derived variable | Formula / logic | Theme |
|---|---|---|
| `water_deficit_hours` | `24 − water_hours_supply` | Water |
| `water_storage_to_demand_ratio` | `water_storage_capacity_l / water_daily_consumption_l` | Water |
| `water_shortage_severity` | normalized `water_shortage_days_month` (0–30 → 0–1) | Water |
| `tanker_dependency_flag` | 1 if `water_source_primary` or `hh_water_source` includes "tanker" | Water |
| `peak_offpeak_water_cost_ratio` | `elec_bill_peak / elec_bill_offpeak` (proxy for peak-season utility strain) | Water |
| `enterprise_waste_practice_score` | `mean(has_dustbins, waste_segregates_dry_wet, waste_collection_freq_peak≥daily)` (0–1) | Waste |
| `sewage_adequacy_score` | 1 if municipal/own-STP, 0.5 septic tank, 0 if "no system" | Waste |
| `zone_dustbin_density` | `zone_dustbin_count / zone_buffer_area_km2` (buffer from OSM, see §4) | Waste |
| `zone_toilet_per_1000_visitors` | `zone_toilet_count / (estimated_peak_footfall/1000)` | Waste |
| `local_employee_share` | `employees_local / (ft_employees + seasonal_employees)` | Economic |
| `income_seasonality_ratio` | `worker_income_offpeak / worker_income_peak` (lower = more precarious) | Economic |
| `tourism_dependency_score` | mapped from `worker_tourism_income_share` buckets → 0–1 | Economic |
| `employment_precarity_index_raw` | `mean(1−worker_has_insurance, 1−worker_paid_on_time, months_employed<12/12)` | Economic |
| `crowding_avoidance_flag` | 1 if `hh_avoids_crowded_areas_peak` = "No" (i.e., avoids own town center) | Socio-cultural |
| `host_strain_score_raw` | `mean(noise_perception, price_inflation_perception, travel_difficulty)` (ordinal → 0–1) | Socio-cultural |
| `infra_adequacy_score_raw` | `mean(has_footpaths, no_potholes, no_waterlogging, has_wifi, healthcare_available, is_disability_friendly, info_displayed_*)` per zone | Infrastructure |
| `signage_effectiveness` | mean of `tourist_ease_of_navigation`, `tourist_signage_sufficiency` (1–5 → 0–1) | Infrastructure |
| `visitor_experience_score_raw` | `mean(tourist_overall_satisfaction, tourist_cleanliness_rating, signage_effectiveness)` | Visitor |
| `peak_season_multiplier_water` | `water_shortage_severity(peak) / water_shortage_severity(reported baseline)` — used by the stress-test module | Cross-cutting |

All `_raw` scores are min-max normalized to **0–1** at build time before entering a composite index (see `workflow.md` §5 for the exact normalization/weighting method).

---

## 4. Composite indicators

| Composite index | Built from (derived, 0–1 each) | Direction |
|---|---|---|
| **Water Stress Index (WSI)** | `water_shortage_severity`, `1 − water_storage_to_demand_ratio(capped)`, `tanker_dependency_flag`, `1 − hh_rainwater_harvesting` | higher = more stressed |
| **Waste & Sanitation Pressure Index (WSPI)** | `1 − enterprise_waste_practice_score`, `1 − sewage_adequacy_score`, `1 − zone_dustbin_density(norm)`, `1 − zone_toilet_per_1000_visitors(norm)` | higher = more pressure |
| **Infrastructure Adequacy Index (IAI)** | `infra_adequacy_score_raw`, `signage_effectiveness`, `emergency_response_time_min (inverted, normalized)` | higher = better (inverted before combining into TVI) |
| **Economic Dependency & Precarity Index (EDPI)** | `tourism_dependency_score`, `employment_precarity_index_raw`, `1 − local_employee_share`, `1 − income_seasonality_ratio` | higher = more precarious |
| **Socio-Cultural Pressure Index (SCPI)** | `host_strain_score_raw`, `crowding_avoidance_flag`, `hh_environment_trend_5yr (declining→1)` | higher = more pressure |
| **Visitor Experience Index (VEI)** | `visitor_experience_score_raw` | higher = better (inverted before combining into TVI) |
| **Tourism Vulnerability Index (TVI)** | `w1·WSI + w2·WSPI + w3·(1−IAI) + w4·EDPI + w5·SCPI + w6·(1−VEI)` | 0–100, higher = more vulnerable. **Default: equal weights (1/6 each) — first thing to tune with domain reviewers.** |
| **Peak-Season Stress Multiplier (PSSM)** | Ratio of peak-season values to off-season/baseline values across WSI, EDPI, and waste-generation proxies; drives the interactive "what happens at +X% tourist footfall" slider | scenario output, not part of TVI |

Index construction method (normalize → weight → aggregate) and the stress-test simulator's elasticity
assumptions are detailed in `workflow.md` §5–§6.

---

## 5. Public / external data

None of these require a paid key; all are free/open. They enrich the survey data, they don't
replace it.

| Source | What we pull | Access method | Feeds into |
|---|---|---|---|
| **OpenStreetMap (Overpass API)** | POI counts within a buffer (~150–300m) around each of the 10 zone points: `amenity=parking`, `amenity=waste_basket`, `amenity=toilets`, `amenity=drinking_water`, `amenity=hospital/pharmacy`, `tourism=hotel/attraction`, `highway=footway` length, `natural=water` (Naini Lake outline) | Overpass QL query, live HTTP, no key | Cross-checks/backfills Location survey infra counts; `zone_dustbin_density`, IAI |
| **OSM Nominatim** | Reverse-geocode the 10 zone lat/lon into human-readable place names (e.g., "Mall Road", "Naini Lake", "Tallital") | Reverse geocode HTTP call, no key (rate-limited, cache results) | Zone labels for maps/charts |
| **Open-Meteo Historical Weather API** | Monthly rainfall & temperature normals for Nainital coords, incl. monsoon (Jun–Sep) extremes | Live HTTP JSON, no key | Context for water-availability trend & seasonality; flags flood/landslide-prone months |
| **Open-Elevation API / SRTM** | Elevation at each zone point (terrain steepness proxy) | Live HTTP JSON, no key | Disaster/terrain-risk context, not in TVI v1 |
| **Census of India 2011 (Nainital Nagar Palika Parishad)** | Resident population count | Static, manually sourced once, cited in code | Per-capita ratios (infra per resident vs per peak tourist) |
| **Uttarakhand Tourism Dept / Ministry of Tourism (India) annual tourist-arrival statistics** | Approx. annual/peak-month tourist footfall for Nainital | Static reference table, manually sourced from published reports, cited | Denominator for `zone_toilet_per_1000_visitors`, PSSM baseline |
| **Geological Survey of India (GSI) landslide susceptibility zonation** | Qualitative landslide-risk flag (High/Medium/Low) for Nainital town | Static, manually sourced once, cited | Optional context layer on the map (not scored into TVI v1) |

All static reference numbers get their own small `reference_data/` table with a source URL/citation
and retrieval date, so they're auditable and easy to refresh later — never hardcoded inline in the
transform code.

---

## 6. Known data-quality issues to handle before deriving anything

- **Versioned/duplicate columns**: several questions were re-asked under near-duplicate column
  names across form revisions (e.g., Tourist survey has `...v1`, `...v1.1`-style columns like
  "Overall, how satisfied..." appearing empty while the answer lives in a differently-labeled
  duplicate column such as `(1 Very Dissatisfied – 5 Very Satisfied).3`). These must be coalesced
  per respondent before any variable is trusted.
- **GPS outliers**: at least one Enterprise row has `latitude/longitude = 82` (clearly a data-entry
  error, not a real coordinate near Nainital's ~29.39°N/79.46°E). Needs a bounding-box filter.
- **Location survey n=10**: only 10 site audits exist — that's our zone count, small but usable as a
  fixed lookup table, not something to statistically model further.
- **Zone names undefined**: the Location survey only has lat/lon, no name field — we'll assign
  names via Nominatim reverse geocoding and let the user confirm/rename them in review.
