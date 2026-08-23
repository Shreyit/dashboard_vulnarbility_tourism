import type {
  ChatResponse,
  EsacOut,
  IndexBundle,
  InsightsOut,
  ResidentAttitudesOut,
  StressTestOut,
  VariablesOut,
  ZoneOut,
} from "./types";

// Relative paths: Vite's dev proxy (vite.config.ts) forwards /api/* to FastAPI on :8010;
// a production build served by FastAPI's StaticFiles hits the same origin directly.
const BASE = "/api";

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

export { ApiError };
