import type { FigurePreset } from "../types";

function grouped(ids: string[], groupId: string): Record<string, string> {
  return Object.fromEntries(ids.map((id) => [id, groupId]));
}

const EHT_2017 = ["ALMA", "APEX", "IRAM", "JCMT", "LMT", "SMA", "SMT", "SPT"];
const EHT_2018 = [...EHT_2017, "GLT"];
const EHT_2021 = [
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
];
const EHT_2022 = [...EHT_2021, "LMT"];
const EHT_2023 = [
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
];
const EHT_2024 = [
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
];

const GMVA = [
  "ALMA",
  "APEX",
  "EFF",
  "GBT",
  "IRAM",
  "KVNYS",
  "KVNPC",
  "KVNTN",
  "KVNUS",
  "MET",
  "NOEMA",
  "ONS",
  "VLBBR",
  "VLBFD",
  "VLBKP",
  "VLBLA",
  "VLBMK",
  "VLBNL",
  "VLBOV",
  "VLBPT",
  "YEB",
];

const NGEHT_PHASE_1_GROUP_1 = [
  "ALMA",
  "APEX",
  "GLT",
  "IRAM",
  "JCMT",
  "KP",
  "KVNPC",
  "KVNYS",
  "LMT",
  "NOEMA",
  "SMA",
  "SMT",
  "SPT",
];
const NGEHT_PHASE_1_GROUP_2 = ["HAY", "JELM", "LAS", "OVRO", "BAJA", "CNI"];
const NGEHT_PHASE_2_GROUP_3 = ["HESS", "BOL", "KILI", "SGO", "SPX"];

const VGOS = [
  "EFF",
  "GARS",
  "GGAO",
  "HOB",
  "ISH",
  "KATH",
  "KOKEE",
  "MACGO",
  "MET",
  "MIZ",
  "NAN",
  "NYALE",
  "ONSNE",
  "ONSSW",
  "SHE",
  "TNMA",
  "WEST",
  "WETTZ",
  "YEB",
];

const VLBA = [
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
];

export const PRESETS: FigurePreset[] = [
  {
    id: "blank",
    name: "Blank globe",
    description: "No telescopes selected.",
    siteGroups: {},
  },
  {
    id: "eht-2017",
    name: "EHT (2017)",
    description: "Event Horizon Telescope 2017 observing array.",
    siteGroups: grouped(EHT_2017, "eht"),
  },
  {
    id: "eht-2018",
    name: "EHT (2018)",
    description: "Event Horizon Telescope 2018 observing array.",
    siteGroups: grouped(EHT_2018, "eht"),
  },
  {
    id: "eht-2021",
    name: "EHT (2021)",
    description: "Event Horizon Telescope 2021 observing array.",
    siteGroups: grouped(EHT_2021, "eht"),
  },
  {
    id: "eht-2022",
    name: "EHT (2022)",
    description: "Event Horizon Telescope 2022 observing array.",
    siteGroups: grouped(EHT_2022, "eht"),
  },
  {
    id: "eht-2023",
    name: "EHT (2023)",
    description: "Event Horizon Telescope 2023 observing array.",
    siteGroups: grouped(EHT_2023, "eht"),
  },
  {
    id: "eht-2024",
    name: "EHT (2024)",
    description: "Event Horizon Telescope 2024 observing array.",
    siteGroups: grouped(EHT_2024, "eht"),
  },
  {
    id: "gmva",
    name: "GMVA",
    description: "Global Millimeter VLBI Array.",
    siteGroups: grouped(GMVA, "eht"),
  },
  {
    id: "ngeht-phase-1",
    name: "ngEHT (Phase 1)",
    description: "Phase 1 reference array, grouped by existing and new sites.",
    siteGroups: {
      ...grouped(NGEHT_PHASE_1_GROUP_1, "eht"),
      ...grouped(NGEHT_PHASE_1_GROUP_2, "ngeht"),
    },
  },
  {
    id: "ngeht-phase-2",
    name: "ngEHT (Phase 2)",
    description: "Phase 2 reference array, grouped by deployment phase.",
    siteGroups: {
      ...grouped(NGEHT_PHASE_1_GROUP_1, "eht"),
      ...grouped(NGEHT_PHASE_1_GROUP_2, "ngeht"),
      ...grouped(NGEHT_PHASE_2_GROUP_3, "other"),
    },
  },
  {
    id: "vgos",
    name: "VGOS",
    description: "VLBI Global Observing System.",
    siteGroups: grouped(VGOS, "eht"),
  },
  {
    id: "vlba",
    name: "VLBA",
    description: "The ten Very Long Baseline Array stations.",
    siteGroups: grouped(VLBA, "eht"),
  },
];
