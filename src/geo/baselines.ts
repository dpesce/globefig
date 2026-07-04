import type { TelescopeSite } from "../types";

export interface BaselinePair {
  first: TelescopeSite;
  second: TelescopeSite;
  firstSiteIds: string[];
  secondSiteIds: string[];
}

const COLOCATED_SITE_GROUPS = [
  ["ALMA", "APEX"],
  ["JCMT", "SMA"],
] as const;

const LOCATION_KEY_BY_SITE = new Map<string, string>(
  COLOCATED_SITE_GROUPS.flatMap((siteIds) =>
    siteIds.map((siteId) => [siteId, siteIds.join("+")] as const),
  ),
);

export function siteLocationKey(siteId: string): string {
  return LOCATION_KEY_BY_SITE.get(siteId) ?? siteId;
}

export function buildBaselinePairs(sites: TelescopeSite[]): BaselinePair[] {
  const sitesByLocation = new Map<string, TelescopeSite[]>();
  for (const site of sites) {
    const key = siteLocationKey(site.id);
    const locationSites = sitesByLocation.get(key) ?? [];
    locationSites.push(site);
    sitesByLocation.set(key, locationSites);
  }

  const locations = [...sitesByLocation.values()];
  const pairs: BaselinePair[] = [];
  for (let firstIndex = 0; firstIndex < locations.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < locations.length; secondIndex += 1) {
      pairs.push({
        first: locations[firstIndex][0],
        second: locations[secondIndex][0],
        firstSiteIds: locations[firstIndex].map((site) => site.id),
        secondSiteIds: locations[secondIndex].map((site) => site.id),
      });
    }
  }
  return pairs;
}

export function baselineCount(siteCount: number): number {
  return siteCount < 2 ? 0 : (siteCount * (siteCount - 1)) / 2;
}
