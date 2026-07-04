import type { TelescopeSite } from "../types";

export interface BaselinePair {
  first: TelescopeSite;
  second: TelescopeSite;
}

export function buildBaselinePairs(sites: TelescopeSite[]): BaselinePair[] {
  const pairs: BaselinePair[] = [];
  for (let firstIndex = 0; firstIndex < sites.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < sites.length; secondIndex += 1) {
      pairs.push({
        first: sites[firstIndex],
        second: sites[secondIndex],
      });
    }
  }
  return pairs;
}

export function baselineCount(siteCount: number): number {
  return siteCount < 2 ? 0 : (siteCount * (siteCount - 1)) / 2;
}
