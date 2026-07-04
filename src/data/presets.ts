import type { FigurePreset } from "../types";

function grouped(ids: string[], groupId: string): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, groupId]));
}

const EHT_2017 = ["IRAM", "SMT", "SMA", "LMT", "ALMA", "SPT", "APEX", "JCMT"];
const EHT_REFERENCE = [
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
  "KVNYS",
  "KVNPC",
];
const NGEHT_PHASE_1 = ["BAJA", "CNI", "HAY", "LAS", "OVRO", "JELM"];
const VARIANT_08_NGEHT = ["BAJA", "CNI", "JELM", "LAS", "KILI"];
const VARIANT_08_OTHER = ["HESS", "HAY"];

export const PRESETS: FigurePreset[] = [
  {
    id: "blank",
    name: "Blank globe",
    description: "No telescopes selected.",
    siteGroups: {},
  },
  {
    id: "eht-2017",
    name: "EHT 2017 (legacy)",
    description: "Eight-station configuration from the legacy source files.",
    siteGroups: grouped(EHT_2017, "eht"),
  },
  {
    id: "eht-reference",
    name: "EHT reference array",
    description: "Reference EHT set used in the legacy Variant 08 figure.",
    siteGroups: grouped(EHT_REFERENCE, "eht"),
  },
  {
    id: "ngeht-phase-1",
    name: "EHT + ngEHT Phase 1 (legacy)",
    description: "Reference EHT set plus the legacy Phase 1 candidate set.",
    siteGroups: {
      ...grouped(EHT_REFERENCE, "eht"),
      ...grouped(NGEHT_PHASE_1, "ngeht"),
    },
  },
  {
    id: "variant-08",
    name: "Variant 08",
    description: "Reproduces the site membership and visual hierarchy of the supplied reference.",
    siteGroups: {
      ...grouped(EHT_REFERENCE, "eht"),
      ...grouped(VARIANT_08_NGEHT, "ngeht"),
      ...grouped(VARIANT_08_OTHER, "other"),
    },
    patch: {
      projection: {
        name: "hammer",
        centerLongitude: -75,
        centerLatitude: 12,
      },
      baselines: {
        enabled: true,
        geometry: "auto",
        color: "#d9efff",
        width: 0.8,
        opacity: 0.28,
        colorByGroup: true,
        focusSiteId: null,
        focusColor: "#ff335f",
        focusWidth: 3,
        focusOpacity: 0.92,
      },
      labels: {
        enabled: true,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 21,
        fontWeight: "700",
        color: "#ffffff",
        useGroupColors: true,
        haloEnabled: true,
        haloColor: "#050a12",
        haloWidth: 4,
        showLeaderLines: false,
      },
    },
  },
];
