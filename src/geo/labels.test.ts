import { describe, expect, it } from "vitest";
import { SITES } from "../data/sites";
import { createDefaultConfig } from "../state/config";
import type { ProjectedSite } from "../types";
import { placeLabels } from "./labels";

function projectedSite(): ProjectedSite {
  const config = createDefaultConfig();
  return {
    site: SITES.find((site) => site.id === "ALMA")!,
    label: "ALMA",
    x: 500,
    y: 250,
    visible: true,
    group: config.groups.eht,
  };
}

describe("label placement", () => {
  it("keeps a manual label anchor fixed while crossing the telescope axis", () => {
    const site = projectedSite();
    const leftConfig = createDefaultConfig();
    leftConfig.labelOffsets.ALMA = {
      dx: -20,
      dy: -40,
      anchor: "start",
    };
    const rightConfig = createDefaultConfig();
    rightConfig.labelOffsets.ALMA = {
      dx: 20,
      dy: -40,
      anchor: "start",
    };

    const left = placeLabels([site], leftConfig)[0];
    const right = placeLabels([site], rightConfig)[0];

    expect(left.anchor).toBe("start");
    expect(right.anchor).toBe("start");
    expect(right.x - left.x).toBe(40);
    expect(right.y).toBe(left.y);
  });

  it("retains the legacy anchor inference for saved offsets without an anchor", () => {
    const site = projectedSite();
    const config = createDefaultConfig();
    config.labelOffsets.ALMA = { dx: 0, dy: -40 };

    expect(placeLabels([site], config)[0].anchor).toBe("middle");
  });
});
