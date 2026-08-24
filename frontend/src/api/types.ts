// Mirrors backend/app/schemas.py. Kept in sync manually for v1 (workflow.md SS9).

export type ThemeKey = "wsi" | "wspi" | "iai" | "edpi" | "scpi" | "vei";

export type ZoneOut = {
  zone_id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

export type ComponentDetail = {
  component: string;
  value: number;
  town_wide_proxy: boolean;
};

export type IndexBundle = {
  zone_id: string | null;
  tvi: number | null;
  sub_indices: Partial<Record<ThemeKey, number | null>>;
  details: Partial<Record<ThemeKey, ComponentDetail[]>>;
};

export type VariablesOut = {
  theme: ThemeKey;
  label: string;
  zone_id: string | null;
  components: ComponentDetail[];
};

export type FootfallPreset = { label: string; multiplier: number };

export type FootfallAnchors = {
  road_capacity_vehicles: number;
  baseline_peak_vehicles_low: number;
  baseline_peak_vehicles_high: number;
  extreme_weekend_vehicles: number;
  presets: FootfallPreset[];
};

export type StressTestOut = {
  footfall_multiplier: number;
  zone_id: string | null;
  baseline: { tvi: number | null; sub_indices: Partial<Record<ThemeKey, number | null>> };
  scenario: { tvi: number | null; sub_indices: Partial<Record<ThemeKey, number | null>> };
  elasticities: Partial<Record<ThemeKey, number>>;
  footfall_anchors: FootfallAnchors;
  note: string;
};

export type ChatResponse = {
  reply: string;
  grounded: boolean;
  llm_configured: boolean;
};

export type SustainabilityTriad = {
  economic: number | null;
  environmental: number | null;
  social: number | null;
};

export type StakeholderMatrix = {
  surveys: string[];
  themes: ThemeKey[];
  matrix: Record<string, Partial<Record<ThemeKey, number | null>>>;
};

export type SeasonalityOut = {
  value: number | null;
  components: ComponentDetail[];
};

export type HostVisitorGapOut = {
  visitor_satisfaction: number | null;
  host_sentiment: number | null;
  gap: number | null;
  doxey_stage: string | null;
};

export type InsightsOut = {
  sustainability: SustainabilityTriad;
  stakeholder_matrix: StakeholderMatrix;
  seasonality: SeasonalityOut;
  host_visitor_gap: HostVisitorGapOut;
};

// Display metadata for the stakeholder matrix rows -- the backend only sends survey keys.
export const STAKEHOLDER_META: Record<string, string> = {
  enterprise: "Enterprises",
  residents: "Residents",
  workers: "Workers",
  tourist: "Tourists",
};

// One fixed, validated color per stakeholder group -- the one place in this dashboard
// that uses distinct hues instead of the single-rust-plus-texture convention (per-user
// request, for the "who we surveyed" stakeholder-mix chart). Keyed by the plural display
// label demographics.py's respondent_mix already returns. Checked with the dataviz
// skill's validate_palette.js against the --surface paper background (#f6f2ea): all
// four clear the lightness band, chroma floor, adjacent CVD (>=8, worst 11.3), the
// normal-vision floor (>=15, worst 17.2) and contrast -- see git history for the run.
export const STAKEHOLDER_COLORS: Record<string, string> = {
  Tourists: "#b3501f", // rust -- the dashboard's existing accent
  Residents: "#0e8f7c", // teal
  Workers: "#9c6b0a", // ochre
  Enterprises: "#7a3564", // plum
};

export type EsacZone = {
  zone_id: string;
  composite: number | null;
  band: string | null;
};

export type EsacOut = {
  exposure: number | null;
  sensitivity: number | null;
  adaptive_capacity: number | null;
  composite: number | null;
  band: string | null;
  zones: EsacZone[];
};

export type GroupComparison = {
  n_dependent: number;
  n_non_dependent: number;
  mean_dependent: number;
  mean_non_dependent: number;
  median_dependent: number;
  median_non_dependent: number;
  p_value: number;
  rank_biserial: number;
  band: "significant" | "marginal" | "not significant";
};

export type ResidentAttitudesOut = {
  group_sizes: { dependent: number; non_dependent: number };
  aggregate: GroupComparison | null;
  pillars: Record<"economic" | "social" | "environmental", GroupComparison | null>;
};

export type ScenarioTrendPoint = {
  label: string;
  multiplier: number;
  tvi: number | null;
};

export type StakeholderTriad = {
  economic: number | null;
  environmental: number | null;
  social: number | null;
};

export type DemographicBar = {
  label: string;
  value: number;
  count: number;
};

export type DemographicsOut = {
  respondent_mix: DemographicBar[];
  zones_surveyed: number;
  tourist_age_group: DemographicBar[];
  tourist_gender: DemographicBar[];
  tourist_first_visit: DemographicBar[];
  tourist_accommodation: DemographicBar[];
  enterprise_type: DemographicBar[];
  worker_sector: DemographicBar[];
};

export type ResidentLocation = {
  latitude: number;
  longitude: number;
  zone_id: string | null;
  tourism_dependent: boolean | null;
};

// Direction + display metadata the backend doesn't need to send but the UI does.
export const THEME_META: Record<ThemeKey, { label: string; short: string; higherIsBetter: boolean }> = {
  wsi: { label: "Water Stress Index", short: "Water", higherIsBetter: false },
  wspi: { label: "Waste & Sanitation Pressure Index", short: "Waste & Sanitation", higherIsBetter: false },
  iai: { label: "Infrastructure Adequacy Index", short: "Infrastructure", higherIsBetter: true },
  edpi: { label: "Economic Dependency & Precarity Index", short: "Economic Precarity", higherIsBetter: false },
  scpi: { label: "Socio-Cultural Pressure Index", short: "Socio-Cultural", higherIsBetter: false },
  vei: { label: "Visitor Experience Index", short: "Visitor Experience", higherIsBetter: true },
};

export const THEME_ORDER: ThemeKey[] = ["wsi", "wspi", "iai", "edpi", "scpi", "vei"];
