import type { AppConfig, FigurePreset, StyleGroup } from "../types";

export const DEFAULT_GROUPS: Record<string, StyleGroup> = {
  eht: {
    id: "eht",
    name: "EHT",
    markerShape: "circle",
    markerSize: 7,
    markerFill: "#f7d7a1",
    markerStroke: "#07101f",
    markerStrokeWidth: 1.5,
    labelColor: "#f7d7a1",
    baselineColor: "#f6f8fc",
    baselineOpacity: 0.28,
  },
  ngeht: {
    id: "ngeht",
    name: "ngEHT",
    markerShape: "circle",
    markerSize: 7,
    markerFill: "#62c8ff",
    markerStroke: "#07101f",
    markerStrokeWidth: 1.5,
    labelColor: "#62c8ff",
    baselineColor: "#62c8ff",
    baselineOpacity: 0.42,
  },
  other: {
    id: "other",
    name: "Additional",
    markerShape: "circle",
    markerSize: 7,
    markerFill: "#ffffff",
    markerStroke: "#07101f",
    markerStrokeWidth: 1.5,
    labelColor: "#ffffff",
    baselineColor: "#ffffff",
    baselineOpacity: 0.14,
  },
};

export function createDefaultConfig(): AppConfig {
  return {
    schemaVersion: 1,
    projection: {
      name: "hammer",
      centerLongitude: -75,
      centerLatitude: 12,
    },
    figure: {
      width: 1500,
      height: 786,
      background: "#f6f7fb",
      transparent: false,
    },
    map: {
      showRaster: true,
      rasterOpacity: 1,
      showGraticule: false,
      graticuleColor: "#dce8f7",
      graticuleOpacity: 0.28,
      borderColor: "#050a12",
      borderWidth: 3,
    },
    baselines: {
      enabled: true,
      geometry: "auto",
      color: "#d9efff",
      width: 0.8,
      opacity: 0.3,
      colorByGroup: false,
      focusSiteId: null,
      focusColor: "#ff335f",
      focusWidth: 3,
      focusOpacity: 0.92,
    },
    labels: {
      enabled: true,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
      useGroupColors: true,
      haloEnabled: true,
      haloColor: "#050a12",
      haloWidth: 4,
      showLeaderLines: false,
    },
    selectedSites: {},
    groups: structuredClone(DEFAULT_GROUPS),
    labelOffsets: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeRecords<T extends Record<string, unknown>>(base: T, incoming: unknown): T {
  if (!isRecord(incoming)) return base;
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(incoming)) {
    const baseValue = result[key];
    result[key] =
      isRecord(baseValue) && isRecord(value) ? mergeRecords(baseValue, value) : value;
  }
  return result as T;
}

export function normalizeConfig(value: unknown): AppConfig {
  const defaults = createDefaultConfig();
  if (!isRecord(value) || value.schemaVersion !== 1) return defaults;
  const merged = mergeRecords(defaults as unknown as Record<string, unknown>, value) as unknown as AppConfig;
  merged.figure.width = Math.min(6000, Math.max(600, Number(merged.figure.width) || 1500));
  merged.figure.height = Math.min(4000, Math.max(300, Number(merged.figure.height) || 786));
  merged.projection.centerLongitude = Math.min(
    180,
    Math.max(-180, Number(merged.projection.centerLongitude) || 0),
  );
  merged.projection.centerLatitude = Math.min(
    90,
    Math.max(-90, Number(merged.projection.centerLatitude) || 0),
  );
  return merged;
}

export function applyPreset(config: AppConfig, preset: FigurePreset): AppConfig {
  const patched = preset.patch
    ? mergeRecords(config as unknown as Record<string, unknown>, preset.patch) as unknown as AppConfig
    : structuredClone(config);

  return normalizeConfig({
    ...patched,
    selectedSites: structuredClone(preset.siteGroups),
    labelOffsets: {},
    baselines: {
      ...patched.baselines,
      focusSiteId: null,
    },
  });
}
