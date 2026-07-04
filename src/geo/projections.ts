import {
  geoDistance,
  geoMercator,
  geoOrthographic,
  type GeoPermissibleObjects,
  type GeoProjection,
} from "d3-geo";
import { geoHammer, geoMollweide, geoRobinson } from "d3-geo-projection";
import type { AppConfig, BaselineGeometry, ProjectionName, TelescopeSite } from "../types";

export const SPHERE: GeoPermissibleObjects = { type: "Sphere" };

export const PROJECTION_OPTIONS: Array<{
  value: ProjectionName;
  label: string;
  note: string;
}> = [
  {
    value: "hammer",
    label: "Hammer–Aitoff",
    note: "Equal-area whole-sky view",
  },
  {
    value: "orthographic",
    label: "Orthographic",
    note: "One visible hemisphere",
  },
  {
    value: "mollweide",
    label: "Mollweide",
    note: "Equal-area elliptical view",
  },
  {
    value: "robinson",
    label: "Robinson",
    note: "Balanced compromise view",
  },
  {
    value: "mercator",
    label: "Mercator",
    note: "Clips the poles, including SPT",
  },
];

export function createProjection(
  config: AppConfig["projection"],
  width: number,
  height: number,
): GeoProjection {
  let projection: GeoProjection;

  switch (config.name) {
    case "orthographic":
      projection = geoOrthographic().clipAngle(90);
      break;
    case "mollweide":
      projection = geoMollweide();
      break;
    case "robinson":
      projection = geoRobinson();
      break;
    case "mercator":
      projection = geoMercator();
      break;
    case "hammer":
    default:
      projection = geoHammer();
      break;
  }

  const latitude = config.name === "orthographic" ? config.centerLatitude : 0;
  projection
    .rotate([-config.centerLongitude, -latitude, 0])
    .precision(0.35)
    .fitExtent(
      [
        [Math.max(18, width * 0.025), Math.max(18, height * 0.04)],
        [width - Math.max(18, width * 0.025), height - Math.max(18, height * 0.04)],
      ],
      SPHERE,
    );

  return projection;
}

export function isSiteVisible(
  site: Pick<TelescopeSite, "longitude" | "latitude">,
  config: AppConfig["projection"],
  projection: GeoProjection,
): boolean {
  if (config.name === "orthographic") {
    return (
      geoDistance(
        [config.centerLongitude, config.centerLatitude],
        [site.longitude, site.latitude],
      ) <=
      Math.PI / 2 + 1e-6
    );
  }

  if (config.name === "mercator" && Math.abs(site.latitude) >= 85) return false;
  const point = projection([site.longitude, site.latitude]);
  return point !== null && point.every(Number.isFinite);
}

export function resolveBaselineGeometry(
  geometry: BaselineGeometry,
  projection: ProjectionName,
): Exclude<BaselineGeometry, "auto"> {
  if (geometry !== "auto") return geometry;
  return projection === "orthographic" ? "straight" : "geodesic";
}
