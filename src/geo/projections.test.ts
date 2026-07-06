import { describe, expect, it } from "vitest";
import { geoDistance } from "d3-geo";
import { SITE_BY_ID } from "../data/sites";
import { createDefaultConfig } from "../state/config";
import {
  createProjection,
  PRIMARY_PROJECTION_OPTIONS,
  PROJECTION_NAMES,
  resolveBaselineGeometry,
  SECONDARY_PROJECTION_OPTIONS,
} from "./projections";

describe("map projections", () => {
  const width = 1500;
  const height = 786;

  it.each(PROJECTION_NAMES)(
    "projects and inverts ALMA with the %s projection",
    (name) => {
      const config = createDefaultConfig().projection;
      config.name = name;
      const projection = createProjection(config, width, height);
      const alma = SITE_BY_ID.get("ALMA")!;
      const point = projection([alma.longitude, alma.latitude]);
      expect(point).not.toBeNull();
      expect(point?.every(Number.isFinite)).toBe(true);
      const inverted = projection.invert?.(point!);
      expect(inverted).toBeDefined();
      expect(inverted?.every(Number.isFinite)).toBe(true);
    },
  );

  it("keeps the four common projections separate from ten secondary choices", () => {
    expect(PRIMARY_PROJECTION_OPTIONS.map((option) => option.value)).toEqual([
      "hammer",
      "orthographic",
      "mollweide",
      "robinson",
    ]);
    expect(SECONDARY_PROJECTION_OPTIONS).toHaveLength(10);
  });

  it("round-trips representative coordinates through Strebe 1995", () => {
    const config = createDefaultConfig().projection;
    config.name = "strebe";
    const projection = createProjection(config, width, height);

    for (const longitude of [-170, -90, 0, 90, 170]) {
      for (const latitude of [-80, -45, 0, 45, 80]) {
        const coordinate: [number, number] = [longitude, latitude];
        const point = projection(coordinate);
        const inverted = point && projection.invert?.(point);
        expect(inverted).toBeDefined();
        expect(geoDistance(coordinate, inverted!)).toBeLessThan(1e-6);
      }
    }
  });

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
