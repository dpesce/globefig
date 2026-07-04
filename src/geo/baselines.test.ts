import { describe, expect, it } from "vitest";
import { buildBaselinePairs, baselineCount } from "./baselines";
import { SITES } from "../data/sites";

describe("baseline generation", () => {
  it("uses each unordered pair exactly once", () => {
    const sites = SITES.slice(0, 20);
    const pairs = buildBaselinePairs(sites);
    expect(pairs).toHaveLength(190);
    expect(new Set(pairs.map((pair) => `${pair.first.id}:${pair.second.id}`)).size).toBe(190);
    expect(pairs.every((pair) => pair.first.id !== pair.second.id)).toBe(true);
  });

  it("calculates complete-array baseline counts", () => {
    expect(baselineCount(0)).toBe(0);
    expect(baselineCount(1)).toBe(0);
    expect(baselineCount(8)).toBe(28);
    expect(baselineCount(20)).toBe(190);
    expect(baselineCount(115)).toBe(6555);
  });
});
