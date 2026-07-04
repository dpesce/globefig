import { describe, expect, it } from "vitest";
import { SITE_BY_ID } from "../data/sites";
import { createDefaultConfig } from "../state/config";
import {
  createProjection,
  resolveBaselineGeometry,
} from "./projections";
import type { ProjectionName } from "../types";

describe("map projections", () => {
  const width = 1500;
  const height = 786;
  const projectionNames: ProjectionName[] = [
    "hammer",
    "orthographic",
    "mollweide",
    "robinson",
  ];

  it.each(projectionNames)(
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

  it("applies center latitude to whole-globe projections", () => {
    const config = createDefaultConfig().projection;
    config.name = "hammer";
    config.centerLatitude = 0;
    const northUp = createProjection(config, width, height)([0, 0]);
    config.centerLatitude = 35;
    const rotated = createProjection(config, width, height)([0, 0]);
    expect(northUp).not.toEqual(rotated);
  });

  it("uses the requested automatic connection rules", () => {
    expect(resolveBaselineGeometry("auto", "hammer")).toBe("geodesic");
    expect(resolveBaselineGeometry("auto", "orthographic")).toBe("straight");
    expect(resolveBaselineGeometry("geodesic", "orthographic")).toBe("geodesic");
  });
});
