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
    expect(config.labelOverrides).toEqual({});
    expect(Object.values(config.groups).map((group) => group.name)).toEqual([
      "Group 1",
      "Group 2",
      "Group 3",
    ]);
  });

  it("loads the requested ngEHT Phase 2 preset", () => {
    const preset = PRESETS.find((candidate) => candidate.id === "ngeht-phase-2")!;
    const config = applyPreset(createDefaultConfig(), preset);
    expect(Object.keys(config.selectedSites)).toHaveLength(24);
    expect(config.selectedSites.ALMA).toBe("eht");
    expect(config.selectedSites.BAJA).toBe("ngeht");
    expect(config.selectedSites.HESS).toBe("other");
  });

  it("lists array presets alphabetically", () => {
    const names = PRESETS.filter((preset) => preset.id !== "blank").map(
      (preset) => preset.name,
    );
    expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second)));
  });

  it("preserves the requested preset memberships", () => {
    const expected: Record<string, string[]> = {
      "EHT (2017)": ["ALMA", "APEX", "IRAM", "JCMT", "LMT", "SMA", "SMT", "SPT"],
      "EHT (2018)": [
        "ALMA",
        "APEX",
        "GLT",
        "IRAM",
        "JCMT",
        "LMT",
        "SMA",
        "SMT",
        "SPT",
      ],
      "EHT (2021)": [
        "ALMA",
        "APEX",
        "GLT",
        "IRAM",
        "JCMT",
        "KP",
        "NOEMA",
        "SMA",
        "SMT",
        "SPT",
      ],
      "EHT (2022)": [
        "ALMA",
        "APEX",
        "GLT",
        "IRAM",
        "JCMT",
        "KP",
        "LMT",
        "NOEMA",
        "SMA",
        "SMT",
        "SPT",
      ],
      "EHT (2023)": [
        "ALMA",
        "APEX",
        "GLT",
        "JCMT",
        "KP",
        "LMT",
        "NOEMA",
        "SMA",
        "SMT",
        "SPT",
      ],
      "EHT (2024)": [
        "ALMA",
        "APEX",
        "GLT",
        "IRAM",
        "JCMT",
        "KP",
        "KVNYS",
        "LMT",
        "NOEMA",
        "SMA",
        "SMT",
        "SPT",
      ],
      "ngEHT (Phase 1)": [
        "ALMA",
        "APEX",
        "BAJA",
        "CNI",
        "GLT",
        "HAY",
        "IRAM",
        "JCMT",
        "JELM",
        "KP",
        "KVNPC",
        "KVNYS",
        "LAS",
        "LMT",
        "NOEMA",
        "OVRO",
        "SMA",
        "SMT",
        "SPT",
      ],
      "ngEHT (Phase 2)": [
        "ALMA",
        "APEX",
        "BAJA",
        "BOL",
        "CNI",
        "GLT",
        "HAY",
        "HESS",
        "IRAM",
        "JCMT",
        "JELM",
        "KILI",
        "KP",
        "KVNPC",
        "KVNYS",
        "LAS",
        "LMT",
        "NOEMA",
        "OVRO",
        "SGO",
        "SMA",
        "SMT",
        "SPT",
        "SPX",
      ],
      VLBA: [
        "VLBBR",
        "VLBFD",
        "VLBHN",
        "VLBKP",
        "VLBLA",
        "VLBMK",
        "VLBNL",
        "VLBOV",
        "VLBPT",
        "VLBSC",
      ],
    };

    for (const [name, siteIds] of Object.entries(expected)) {
      const preset = PRESETS.find((candidate) => candidate.name === name);
      expect(Object.keys(preset?.siteGroups ?? {}).sort()).toEqual([...siteIds].sort());
    }
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
