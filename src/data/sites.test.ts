import { describe, expect, it } from "vitest";
import { SITE_BY_ID, SITES } from "./sites";

describe("normalized telescope catalog", () => {
  it("contains valid, uniquely identified coordinates", () => {
    expect(SITES).toHaveLength(115);
    expect(new Set(SITES.map((site) => site.id)).size).toBe(SITES.length);
    for (const site of SITES) {
      expect(site.latitude).toBeGreaterThanOrEqual(-90);
      expect(site.latitude).toBeLessThanOrEqual(90);
      expect(site.longitude).toBeGreaterThanOrEqual(-180);
      expect(site.longitude).toBeLessThanOrEqual(180);
    }
  });

  it("preserves the legacy names used by supplied globe figures", () => {
    expect(SITE_BY_ID.get("BAJA")?.displayLabel).toBe("SPM");
    expect(SITE_BY_ID.get("CNI")?.displayLabel).toBe("TEA");
    expect(SITE_BY_ID.get("LAS")?.displayLabel).toBe("LCO");
    expect(SITE_BY_ID.get("HESS")?.displayLabel).toBe("AMT");
    expect(SITE_BY_ID.get("IRAM")?.displayLabel).toBe("IRAM 30m");
    expect(SITE_BY_ID.get("KILI")?.displayLabel).toBe("KILI");
    expect(SITE_BY_ID.get("KVNYS")?.displayLabel).toBe("KVN-YS");
    expect(SITE_BY_ID.get("KVNTN")?.displayLabel).toBe("KVN-TN");
    expect(SITE_BY_ID.get("KVNUS")?.displayLabel).toBe("KVN-US");
  });
});
