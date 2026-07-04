import { describe, expect, it } from "vitest";
import { SITE_BY_ID } from "../data/sites";
import { createDefaultConfig } from "../state/config";
import {
  createProjection,
  isSiteVisible,
  resolveBaselineGeometry,
} from "./projections";
import type { ProjectionName } from "../types";

describe("map projections", () => {
  const width = 1500;
  const height = 786;

  it.each<ProjectionName>(["hammer", "orthographic", "mollweide", "robinson", "mercator"])(
    "projects ALMA with the %s projection",
    (name) => {
      const config = createDefaultConfig().projection;
      config.name = name;
      const projection = createProjection(config, width, height);
      const alma = SITE_BY_ID.get("ALMA")!;
      const point = projection([alma.longitude, alma.latitude]);
      expect(point).not.toBeNull();
      expect(point?.every(Number.isFinite)).toBe(true);
    },
  );

  it("does not claim the South Pole is representable in Mercator", () => {
    const config = createDefaultConfig().projection;
    config.name = "mercator";
    const projection = createProjection(config, width, height);
    expect(isSiteVisible(SITE_BY_ID.get("SPT")!, config, projection)).toBe(false);
  });

  it("uses the requested automatic connection rules", () => {
    expect(resolveBaselineGeometry("auto", "hammer")).toBe("geodesic");
    expect(resolveBaselineGeometry("auto", "orthographic")).toBe("straight");
    expect(resolveBaselineGeometry("geodesic", "orthographic")).toBe("geodesic");
  });
});
