export type ProjectionName =
  | "hammer"
  | "orthographic"
  | "mollweide"
  | "robinson"
  | "mercator";

export type BaselineGeometry = "auto" | "geodesic" | "straight";
export type MarkerShape = "circle" | "square" | "diamond" | "triangle" | "star";

export interface TelescopeSite {
  id: string;
  code: string;
  name: string;
  displayLabel: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
  diameter: number | null;
  aliases: string[];
  defaultGroup: string;
}

export interface StyleGroup {
  id: string;
  name: string;
  markerShape: MarkerShape;
  markerSize: number;
  markerFill: string;
  markerStroke: string;
  markerStrokeWidth: number;
  labelColor: string;
  baselineColor: string;
  baselineOpacity: number;
}

export interface LabelOffset {
  dx: number;
  dy: number;
}

export interface AppConfig {
  schemaVersion: 1;
  projection: {
    name: ProjectionName;
    centerLongitude: number;
    centerLatitude: number;
  };
  figure: {
    width: number;
    height: number;
    background: string;
    transparent: boolean;
  };
  map: {
    showRaster: boolean;
    rasterOpacity: number;
    showGraticule: boolean;
    graticuleColor: string;
    graticuleOpacity: number;
    borderColor: string;
    borderWidth: number;
  };
  baselines: {
    enabled: boolean;
    geometry: BaselineGeometry;
    color: string;
    width: number;
    opacity: number;
    colorByGroup: boolean;
    focusSiteId: string | null;
    focusColor: string;
    focusWidth: number;
    focusOpacity: number;
  };
  labels: {
    enabled: boolean;
    fontFamily: string;
    fontSize: number;
    fontWeight: "400" | "600" | "700";
    color: string;
    useGroupColors: boolean;
    haloEnabled: boolean;
    haloColor: string;
    haloWidth: number;
    showLeaderLines: boolean;
  };
  selectedSites: Record<string, string>;
  groups: Record<string, StyleGroup>;
  labelOffsets: Record<string, LabelOffset>;
}

export interface FigurePreset {
  id: string;
  name: string;
  description: string;
  siteGroups: Record<string, string>;
  patch?: Partial<AppConfig>;
}

export interface ProjectedSite {
  site: TelescopeSite;
  x: number;
  y: number;
  visible: boolean;
  group: StyleGroup;
}

export interface LabelPlacement {
  siteId: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  width: number;
  height: number;
  manual: boolean;
}
