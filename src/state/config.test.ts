import { describe, expect, it } from "vitest";
import { PRESETS } from "../data/presets";
import { applyPreset, createDefaultConfig, normalizeConfig } from "./config";

describe("figure configuration", () => {
  it("starts with a blank Hammer globe and enabled automatic baselines", () => {
    const config = createDefaultConfig();
    expect(config.projection.name).toBe("hammer");
    expect(config.selectedSites).toEqual({});
    expect(config.baselines.enabled).toBe(true);
    expect(config.baselines.geometry).toBe("auto");
  });

  it("loads the 20-site Variant 08 reference preset", () => {
    const preset = PRESETS.find((candidate) => candidate.id === "variant-08")!;
    const config = applyPreset(createDefaultConfig(), preset);
    expect(Object.keys(config.selectedSites)).toHaveLength(20);
    expect(config.selectedSites.ALMA).toBe("eht");
    expect(config.selectedSites.BAJA).toBe("ngeht");
    expect(config.selectedSites.HESS).toBe("other");
  });

  it("bounds imported canvas dimensions", () => {
    const value = {
      ...createDefaultConfig(),
      figure: {
        ...createDefaultConfig().figure,
        width: 100_000,
        height: 1,
      },
    };
    const normalized = normalizeConfig(value);
    expect(normalized.figure.width).toBe(6000);
    expect(normalized.figure.height).toBe(300);
  });
});
