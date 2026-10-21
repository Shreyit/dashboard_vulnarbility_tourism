import type {
  ChatResponse,
  DemographicsOut,
  DependencyModelOut,
  EsacOut,
  IndexBundle,
  InsightsOut,
  ResidentAttitudesOut,
  ResidentLocation,
  ScenarioTrendPoint,
  SensitivityOut,
  StakeholderTriad,
  StressTestOut,
  VariablesOut,
  ZoneClustersOut,
  ZoneOut,
} from "./types";

// Local dev: Vite's dev proxy (vite.config.ts) forwards /api/* to FastAPI on :8010, so the
// relative default works unchanged. Deployed split (frontend on Vercel, backend elsewhere,
// different origins): set VITE_API_BASE_URL to the backend's own /api URL at build time.
const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? `Request to ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function getZones(): Promise<ZoneOut[]> {
  return request("/zones");
}

export function getTownIndices(): Promise<IndexBundle> {
  return request("/indices/town");
}

export function getZoneIndices(zoneId: string): Promise<IndexBundle> {
  return request(`/indices/zone/${zoneId}`);
}

export function getInsights(): Promise<InsightsOut> {
  return request("/insights/town");
}

export function getEsacFramework(): Promise<EsacOut> {
  return request("/insights/esac");
}

export function getResidentAttitudes(): Promise<ResidentAttitudesOut> {
  return request("/insights/resident-attitudes");
}

export function getWorkerDependency(): Promise<ResidentAttitudesOut> {
  return request("/insights/worker-dependency");
}

export function getScenarioTrend(): Promise<ScenarioTrendPoint[]> {
  return request("/insights/scenario-trend");
}

export function getSustainabilityByStakeholder(): Promise<Record<string, StakeholderTriad>> {
  return request("/insights/sustainability-by-stakeholder");
}

export function getDemographics(): Promise<DemographicsOut> {
  return request("/insights/demographics");
}

export function getResidentLocations(): Promise<ResidentLocation[]> {
  return request("/insights/resident-locations");
}

export function getThemeVariables(theme: string, zoneId?: string | null): Promise<VariablesOut> {
  const qs = zoneId ? `?zone_id=${encodeURIComponent(zoneId)}` : "";
  return request(`/variables/${theme}${qs}`);
}

export function postStressTest(footfallMultiplier: number, zoneId?: string | null): Promise<StressTestOut> {
  return request("/stress-test", {
    method: "POST",
    body: JSON.stringify({ footfall_multiplier: footfallMultiplier, zone_id: zoneId ?? null }),
  });
}

export function postChat(message: string, zoneId?: string | null): Promise<ChatResponse> {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message, zone_id: zoneId ?? null }),
  });
}

export function getZoneClusters(): Promise<ZoneClustersOut> {
  return request("/ml/zone-clusters");
}

export function getDependencyModel(): Promise<DependencyModelOut> {
  return request("/ml/dependency-model");
}

export function getSensitivity(): Promise<SensitivityOut> {
  return request("/ml/sensitivity");
}

export { ApiError };
