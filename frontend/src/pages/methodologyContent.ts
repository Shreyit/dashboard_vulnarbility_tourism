// Exact methodology per indicator -- definition, source components, normalization
// method, formula, and citations. Hand-transcribed from VARIABLES_AND_DATA_SOURCES.md
// SS4/SS4.1 and RESEARCH_BENCHMARKS.md; keep the three in sync if a formula changes.

export type Citation = { label: string; url?: string };

export type MethodologyEntry = {
  id: string;
  name: string;
  definition: string;
  components: string[];
  normalization: string;
  formula: string;
  citations: Citation[];
};

export const METHODOLOGY: MethodologyEntry[] = [
  {
    id: "tvi",
    name: "Tourism Vulnerability Index (TVI)",
    definition:
      "The headline 0-100 composite, town-wide or per zone. Higher = more vulnerable to " +
      "tourism pressure. A weighted blend of the six pillars below.",
    components: ["WSI", "WSPI", "1 - IAI", "EDPI", "SCPI", "1 - VEI"],
    normalization:
      "Each pillar is already 0-1 (see its own entry). IAI and VEI are inverted (1-x) before " +
      "combining, since both are 'higher = better' in their own natural direction.",
    formula:
      "TVI = 100 x (w1.WSI + w2.WSPI + w3.(1-IAI) + w4.EDPI + w5.SCPI + w6.(1-VEI)) / (w1+...+w6). " +
      "Default: equal weights (w=1 each), backend/app/weights.json -- the first thing to hand back " +
      "to domain reviewers to retune.",
    citations: [
      {
        label: "OECD/JRC -- Handbook on Constructing Composite Indicators",
        url: "https://www.oecd.org/content/dam/oecd/en/publications/reports/2008/08/handbook-on-constructing-composite-indicators-methodology-and-user-guide_g1gh9301/9789264043466-en.pdf",
      },
    ],
  },
  {
    id: "wsi",
    name: "Water Stress Index (WSI)",
    definition:
      "Higher = more water pressure. Enterprise water-constraint/tanker-dependency signals " +
      "blended with household supply-hours deficit, tanker dependency, and rainwater-harvesting gaps.",
    components: [
      "enterprise.water_constraint_stress",
      "enterprise.tanker_dependency",
      "enterprise.no_rainwater_harvesting",
      "enterprise.peak_offpeak_cost_pressure",
      "residents.water_hours_deficit",
      "residents.tanker_dependency",
      "residents.bought_tanker_water",
      "residents.water_deprioritized_vs_hotels",
      "residents.water_trend_worsened",
      "residents.no_rainwater_harvesting",
    ],
    normalization: "OECD/JRC min-max (1st/99th percentile clip) per component, then simple mean.",
    formula: "WSI = mean(10 components above)",
    citations: [
      {
        label: "Falkenmark Water Stress Indicator -- considered, not directly applicable (per-capita m3/year is the wrong unit for survey-based signals; used as context only)",
      },
    ],
  },
  {
    id: "wspi",
    name: "Waste & Sanitation Pressure Index (WSPI)",
    definition:
      "Higher = more waste/sanitation pressure. Enterprise waste practice and sewage adequacy, " +
      "household sewage adequacy and peak-season overflow, zone-level dustbin/toilet density, and " +
      "tourists' own cleanliness/dustbin-adequacy perception.",
    components: [
      "enterprise.poor_waste_practice",
      "enterprise.poor_sewage_adequacy",
      "residents.poor_sewage_adequacy",
      "residents.sewage_overflow_peak",
      "location.zone_dustbin_density_inv",
      "location.zone_toilet_per_capita_inv",
      "tourist.dustbin_inadequacy_perception",
      "tourist.cleanliness_rating_inv",
    ],
    normalization: "OECD/JRC min-max per component, then simple mean.",
    formula: "WSPI = mean(8 components above)",
    citations: [
      {
        label: "Sphere Handbook -- WASH minimum standard, <20 users per toilet (directly applicable, used as the toilet-provision benchmark)",
        url: "https://ksrpmi.uns.ac.id/wp-content/uploads/2019/09/Sphere-Handbook-2018-WATER-SUPPLY.pdf",
      },
    ],
  },
  {
    id: "iai",
    name: "Infrastructure Adequacy Index (IAI)",
    definition:
      "Higher = better infrastructure (the one pillar, with VEI, stored in the opposite direction " +
      "from the rest -- inverted only when it's combined into the TVI).",
    components: [
      "location.infra_adequacy",
      "location.parking_supply",
      "location.street_light_density",
      "location.toilet_provision",
      "location.soap_water_available",
      "location.emergency_response_speed",
      "tourist.ease_of_navigation",
      "tourist.signage_sufficiency",
    ],
    normalization: "OECD/JRC min-max per component, then simple mean.",
    formula: "IAI = mean(8 components above)",
    citations: [
      {
        label: "GSTC Destination Criteria v2.0 -- our 6 pillars cross-check against GSTC's 4 (this one maps to 'sustainable management')",
        url: "https://www.gstc.org/wp-content/uploads/GSTC-Destination-Criteria-v2.0.pdf",
      },
    ],
  },
  {
    id: "edpi",
    name: "Economic Dependency & Precarity Index (EDPI)",
    definition:
      "Higher = more economically precarious. Worker income dependency and seasonality, resident " +
      "livelihood dependency, and enterprise employment-locality/off-season-support gaps.",
    components: [
      "workers.tourism_income_dependency",
      "workers.months_without_work_share",
      "workers.no_insurance",
      "residents.tourism_dependency",
      "residents.no_other_income_source",
      "enterprise.non_local_employment_share",
      "enterprise.no_offseason_gov_support",
    ],
    normalization: "OECD/JRC min-max per component, then simple mean.",
    formula: "EDPI = mean(7 components above)",
    citations: [
      {
        label: "ILO -- Decent Work Indicators (income security, social protection, seasonality as recognized precarity markers)",
        url: "https://www.ilo.org/sites/default/files/wcmsp5/groups/public/@dgreports/@integration/documents/publication/wcms_229374.pdf",
      },
    ],
  },
  {
    id: "scpi",
    name: "Socio-Cultural Pressure Index (SCPI)",
    definition:
      "Higher = more host-community strain: crowding avoidance, peak-season travel difficulty, " +
      "price inflation, noise, environmental decline, and net-benefit disbelief, plus enterprise " +
      "child-labour observation.",
    components: [
      "residents.crowding_avoidance",
      "residents.travel_difficulty_peak",
      "residents.price_inflation_perception",
      "residents.noise_increase_perception",
      "residents.environment_trend_worsened",
      "residents.tourism_no_net_benefit",
      "enterprise.child_labour_observed",
    ],
    normalization: "OECD/JRC min-max per component, then simple mean.",
    formula: "SCPI = mean(7 components above)",
    citations: [
      {
        label: "Doxey's Irridex (1975) -- 1-SCPI is banded into Euphoria/Apathy/Irritation/Antagonism for the Host-Visitor Perception Gap",
        url: "https://link.springer.com/rwe/10.1007/978-3-319-01669-6_564-1",
      },
    ],
  },
  {
    id: "vei",
    name: "Visitor Experience Index (VEI)",
    definition:
      "Higher = better visitor experience (stored in the opposite direction from the pressure " +
      "pillars, inverted only when combined into the TVI). An inverse signal: poor experience " +
      "often co-occurs with strained infrastructure.",
    components: [
      "tourist.overall_satisfaction",
      "tourist.cleanliness_rating",
      "tourist.ease_of_navigation",
      "tourist.signage_sufficiency",
    ],
    normalization: "OECD/JRC min-max per component, then simple mean.",
    formula: "VEI = mean(4 components above)",
    citations: [
      {
        label: "GSTC Destination Criteria v2.0 -- cross-checks to the 'sustainable management' pillar",
        url: "https://www.gstc.org/wp-content/uploads/GSTC-Destination-Criteria-v2.0.pdf",
      },
    ],
  },
  {
    id: "sustainability",
    name: "Sustainability Triad (Coxcomb)",
    definition:
      "The 6 pillars regrouped into the standard Economic / Social / Environmental sustainability " +
      "triad, unified to one 'higher = more stressed' direction, 0-100 like the TVI.",
    components: ["EDPI", "WSI, WSPI, 1 - IAI", "SCPI, 1 - VEI"],
    normalization: "Reuses each pillar's own OECD/JRC-normalized score; this step re-groups, it doesn't re-normalize.",
    formula: "economic = EDPI; environmental = mean(WSI, WSPI, 1-IAI); social = mean(SCPI, 1-VEI); all x100",
    citations: [
      { label: "Elkington, J. (1997). Cannibals with Forks: The Triple Bottom Line of 21st Century Business. Capstone Publishing." },
      {
        label: "GSTC Destination Criteria v2.0 -- corroborating 4-pillar crosswalk",
        url: "https://www.gstc.org/wp-content/uploads/GSTC-Destination-Criteria-v2.0.pdf",
      },
    ],
  },
  {
    id: "sai",
    name: "Seasonality Amplification Index (SAI)",
    definition:
      "How much worse things get in peak season, from respondents' own peak-season-framed answers " +
      "-- empirical, distinct from the Stress Test's hypothetical footfall-multiplier scenario below.",
    components: [
      "enterprise.water_constraint_stress",
      "enterprise.peak_offpeak_cost_pressure",
      "residents.travel_difficulty_peak",
      "residents.sewage_overflow_peak",
      "workers.months_without_work_share",
    ],
    normalization: "Reuses the same OECD/JRC-normalized components as the 6 pillars.",
    formula: "SAI = 100 x mean(5 components above)",
    citations: [
      { label: "Not modeled on an external benchmark -- an empirical aggregate of this survey's own peak-season questions." },
    ],
  },
  {
    id: "hvg",
    name: "Host-Visitor Perception Gap (HVG)",
    definition:
      "Compares tourist satisfaction against host-community sentiment, banded into a Doxey's " +
      "Irridex stage -- implements the citation the SCPI entry already references.",
    components: ["tourist.overall_satisfaction", "1 - SCPI"],
    normalization: "Reuses SCPI/VEI's own normalization; the banding thresholds are this project's own choice, not a validated cutoff.",
    formula:
      "visitor_satisfaction = tourist.overall_satisfaction; host_sentiment = 1 - SCPI; " +
      "gap = visitor_satisfaction - host_sentiment; stage banded from host_sentiment " +
      "(>=0.75 Euphoria, >=0.5 Apathy, >=0.25 Irritation, else Antagonism)",
    citations: [
      {
        label: "Doxey's Irridex (1975)",
        url: "https://link.springer.com/rwe/10.1007/978-3-319-01669-6_564-1",
      },
    ],
  },
  {
    id: "stress-test",
    name: "Peak-Season Stress Test (PSSM)",
    definition:
      "A scenario calculator, not a forecast: 'if footfall rises by X%, how do the sub-indices " +
      "move?' Each sub-index scales linearly from its computed baseline using a documented " +
      "elasticity, not a black-box model.",
    components: ["Baseline sub-indices (all 6)", "footfall_multiplier", "per-pillar elasticity (backend/app/weights.json)"],
    normalization: "Elasticities: WSI 0.6, WSPI 0.6, IAI 0.3, EDPI 0.0, SCPI 0.4, VEI 0.3 -- tunable, not fixed by an external study.",
    formula:
      "delta = elasticity x (multiplier - 1); pressure pillars: scenario = baseline x (1+delta); " +
      "IAI/VEI: scenario = baseline x (1-delta), clamped to [0,1]; EDPI held fixed (elasticity 0 -- " +
      "tourism income share assumed structurally fixed short-run)",
    citations: [
      {
        label: "Nainital NGT-directed Tourist Carrying Capacity assessment -- road-capacity anchors (~3,000 vehicles vs 3,000-4,000/day peak, ~50,000 extreme weekend)",
        url: "https://politicalsciencesolution.com/uttarakhand-pioneers-tourist-carrying-capacity-assessment-in-nainital-district-to-ensure-sustainable-tourism/",
      },
    ],
  },
  {
    id: "esac",
    name: "E-S-AC Framework (second vulnerability lens)",
    definition:
      "A complementary, IPCC-style Exposure / Sensitivity / Adaptive Capacity structure, built " +
      "alongside the 6-pillar TVI, not in place of it. Reimplemented from a second, " +
      "independently-built workbook's exact formulas and weights, using this pipeline's own " +
      "already-derived columns wherever they match; several inputs substitute the nearest " +
      "available column for one the original framework named more narrowly.",
    components: [
      "Exposure = 0.35 seasonal employment dependency + 0.35 tourism livelihood dependency + 0.30 peak tourism disruption",
      "Sensitivity = 0.30 water operational stress + 0.20 water source stress + 0.20 resident water-service stress + 0.15 resident sanitation stress + 0.15 sewage risk",
      "Adaptive Capacity = 0.55 enterprise adaptation + 0.25 resident adaptation + 0.20 disaster preparedness",
    ],
    normalization:
      "Each weighted mean renormalizes over whichever inputs are present (average over what's " +
      "there, don't fabricate zeros). Several inputs are substitutions for the original workbook's " +
      "narrower variable: enterprise.tanker_dependency stands in for a 3-tier municipal/spring/tanker " +
      "water-source scale; residents.sewage_overflow_peak stands in for a broader sanitation-stress " +
      "measure; residents.tourism_dependency (yes/no) stands in for a continuous tourism-income-share " +
      "ratio; enterprise/resident 'adaptation' use 2 and 1 available components respectively rather " +
      "than the original's 4 and 3. See backend/app/framework_esac.py for the full list.",
    formula:
      "Composite = 100 x [Exposure + Sensitivity + (1 - Adaptive Capacity)] / 3, banded 0-33.33 " +
      "Lower / 33.34-66.67 Moderate / >66.67 Higher, computed both town-wide and per zone.",
    citations: [
      {
        label: "Assessing and Mapping Tourism Vulnerability Using Remote Sensing -- Shimla District case (the Exposure-Sensitivity-Adaptive Capacity structure this reimplements)",
        url: "https://link.springer.com/chapter/10.1007/978-981-95-0156-4_11",
      },
    ],
  },
  {
    id: "resident-attitudes-set",
    name: "Resident Attitudes & Social Exchange Theory",
    definition:
      "Does tourism dependence correlate with less felt irritation at tourism's pressure, as " +
      "Social Exchange Theory predicts? Splits residents into tourism-dependent vs. non-dependent " +
      "and tests three attitude pillars, computed fresh from the real 239 residents in this " +
      "session -- not a reproduction of any externally reported figure.",
    components: [
      "Economic = tourism_no_net_benefit",
      "Social = mean(crowding_avoidance, travel_difficulty_peak, noise_increase_perception)",
      "Environmental = environment_trend_worsened",
      "RII (aggregate) = mean(Economic, Social, Environmental) -- the same component set SCPI already uses, scored per respondent instead of town-averaged",
      "Group = residents.tourism_dependency (tourism as primary livelihood, yes/no)",
    ],
    normalization: "Same OECD/JRC-normalized 0-1 components SCPI already uses; no new derivation.",
    formula:
      "Two-sided Mann-Whitney U test (dependent vs. non-dependent) per pillar and for the " +
      "aggregate; rank-biserial effect size r = 1 - 2U/(n1 x n2) (Kerby, 2014). Banded significant " +
      "(p<0.05) / marginal (0.05-0.10) / not significant (>=0.10). Requires >=5 respondents per " +
      "group to run.",
    citations: [
      {
        label: "Ap, J. (1992). Residents' Perceptions Research on the Social Exchange Theory. Annals of Tourism Research, 19(4), 665-690. (Bibliographic reference -- no URL cited, same treatment as the Elkington 1997 entry.)",
      },
    ],
  },
  {
    id: "trends",
    name: "Trends report (scenario trend + stakeholder radar)",
    definition:
      "Two re-readings of already-computed values, not new derivations. The line chart tracks " +
      "town-wide TVI across the Stress Test's own footfall-multiplier presets, read as a trend " +
      "instead of a single before/after. The radar re-buckets the Stakeholder Pressure Matrix into " +
      "the same Economic/Social/Environmental triad the Overview's Sustainability Triad uses, per " +
      "respondent group instead of town-wide.",
    components: [
      "Line chart: town-wide TVI at each of the Stress Test's footfall_multiplier presets (today, +25%, +50%, extreme weekend)",
      "Radar: economic = EDPI, environmental = mean(WSI, WSPI, 1-IAI), social = mean(SCPI, 1-VEI), computed per survey (enterprise/residents/workers/tourist)",
    ],
    normalization:
      "No new normalization -- reuses the Stress Test's elasticity-scaled sub-indices for the " +
      "line chart, and the Sustainability Triad's own OECD/JRC-normalized pillars for the radar. " +
      "Workers and Tourist only populate 1-2 of the 3 radar pillars, so only groups with all three " +
      "present are plotted -- in practice, Enterprise vs. Residents.",
    formula:
      "Line: tvi = run_stress_test(multiplier).scenario.tvi for each preset (backend/app/stress_test.py: compute_scenario_trend). " +
      "Radar: bucket(survey) = {economic: edpi, environmental: mean(wsi, wspi, iai), social: mean(scpi, vei)} " +
      "x100, from the direction-aligned Stakeholder Pressure Matrix (backend/app/insights.py: compute_sustainability_by_stakeholder).",
    citations: [
      {
        label: "Not modeled on an external benchmark -- both charts re-read this project's own already-computed Stress Test and Stakeholder Pressure Matrix values from a different angle.",
      },
    ],
  },
];
