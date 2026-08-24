import { getZoneIndices, getZones } from "./client";
import type { IndexBundle, ZoneOut } from "./types";

export type ZoneWithIndices = { zone: ZoneOut; bundle: IndexBundle };

/** Zones + their computed indices in one call. Shared by LocalsTab (the map
 * markers) and the Overview KPI row (the "most vulnerable zone" stat). */
export async function loadZonesWithIndices(): Promise<ZoneWithIndices[]> {
  const zones = await getZones();
  const bundles = await Promise.all(zones.map((z) => getZoneIndices(z.zone_id)));
  return zones.map((zone, i) => ({ zone, bundle: bundles[i] }));
}
