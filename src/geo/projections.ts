import {
  geoAzimuthalEqualArea,
  geoDistance,
  geoOrthographic,
  geoProjection,
  type GeoPermissibleObjects,
  type GeoProjection,
  type GeoRawProjection,
} from "d3-geo";
import {
  geoArmadillo,
  geoBonne,
  geoCollignon,
  geoEckert4Raw,
  geoHammer,
  geoHammerRaw,
  geoHammerRetroazimuthal,
  geoInterruptedHomolosine,
  geoLoximuthal,
  geoMollweide,
  geoMollweideRaw,
  geoRectangularPolyconic,
  geoRobinson,
  geoSinusoidal,
} from "d3-geo-projection";
import type { AppConfig, BaselineGeometry, ProjectionName, TelescopeSite } from "../types";

export const SPHERE: GeoPermissibleObjects = { type: "Sphere" };

export interface ProjectionOption {
  value: ProjectionName;
  label: string;
  note: string;
}

export const PRIMARY_PROJECTION_OPTIONS: ProjectionOption[] = [
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
];

export const SECONDARY_PROJECTION_OPTIONS: ProjectionOption[] = [
  {
    value: "sinusoidal",
    label: "Sinusoidal",
    note: "Equal-area pseudocylindrical view",
  },
  {
    value: "goode-homolosine",
    label: "Goode homolosine",
    note: "Interrupted equal-area world map",
  },
  {
    value: "collignon",
    label: "Collignon",
    note: "Equal-area view with triangular poles",
  },
  {
    value: "loximuthal",
    label: "Loximuthal",
    note: "Straight rhumb lines from its reference parallel",
  },
  {
    value: "strebe",
    label: "Strebe",
    note: "Equal-area view designed around continental shapes",
  },
  {
    value: "werner",
    label: "Werner",
    note: "Cordiform equal-area world map",
  },
  {
    value: "rectangular-polyconic",
    label: "Rectangular polyconic",
    note: "The War Office polyconic form",
  },
  {
    value: "lambert-azimuthal",
    label: "Lambert azimuthal equal-area",
    note: "Equal-area view centered on one point",
  },
  {
    value: "hammer-retroazimuthal",
    label: "Hammer retroazimuthal",
    note: "Preserves bearing toward its reference point",
  },
  {
    value: "armadillo",
    label: "Armadillo",
    note: "Decorative oblique world view",
  },
];

export const PROJECTION_OPTIONS = [
  ...PRIMARY_PROJECTION_OPTIONS,
  ...SECONDARY_PROJECTION_OPTIONS,
];

export const PROJECTION_NAMES: ProjectionName[] = PROJECTION_OPTIONS.map(
  (option) => option.value,
);

const STREBE_STRETCH = 1.35;
const STREBE_HAMMER_RAW = geoHammerRaw(2, 2);

const strebeRaw: GeoRawProjection = (longitude, latitude) => {
  const [eckertX, eckertY] = geoEckert4Raw(longitude, latitude);
  const [mollweideLongitude, mollweideLatitude] = geoMollweideRaw.invert!(
    eckertX * STREBE_STRETCH,
    eckertY / STREBE_STRETCH,
  );
  const [hammerX, hammerY] = STREBE_HAMMER_RAW(
    mollweideLongitude,
    mollweideLatitude,
  );
  return [hammerX / STREBE_STRETCH, hammerY * STREBE_STRETCH];
};

strebeRaw.invert = (x, y) => {
  const [mollweideLongitude, mollweideLatitude] = STREBE_HAMMER_RAW.invert!(
    x * STREBE_STRETCH,
    y / STREBE_STRETCH,
  );
  const [eckertX, eckertY] = geoMollweideRaw(
    mollweideLongitude,
    mollweideLatitude,
  );
  return geoEckert4Raw.invert!(
    eckertX / STREBE_STRETCH,
    eckertY * STREBE_STRETCH,
  );
};

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
    case "sinusoidal":
      projection = geoSinusoidal();
      break;
    case "goode-homolosine":
      projection = geoInterruptedHomolosine();
      break;
    case "collignon":
      projection = geoCollignon();
      break;
    case "loximuthal":
      projection = geoLoximuthal();
      break;
    case "strebe":
      projection = geoProjection(strebeRaw);
      break;
    case "werner":
      projection = geoBonne().parallel(90);
      break;
    case "rectangular-polyconic":
      projection = geoRectangularPolyconic();
      break;
    case "lambert-azimuthal":
      projection = geoAzimuthalEqualArea();
      break;
    case "hammer-retroazimuthal":
      projection = geoHammerRetroazimuthal();
      break;
    case "armadillo":
      projection = geoArmadillo();
      break;
    case "hammer":
    default:
      projection = geoHammer();
      break;
  }

  projection
    .rotate([-config.centerLongitude, -config.centerLatitude, 0])
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

  const point = projection([site.longitude, site.latitude]);
  if (point === null || !point.every(Number.isFinite)) return false;
  if (config.name !== "armadillo") return true;

  // Armadillo deliberately omits part of the far southern hemisphere. Its raw
  // projection moves those points outside the outline rather than returning null.
  const inverse = projection.invert?.(point);
  return (
    inverse !== undefined &&
    inverse !== null &&
    inverse.every(Number.isFinite) &&
    geoDistance([site.longitude, site.latitude], inverse) < 1e-5
  );
}

export function resolveBaselineGeometry(
  geometry: BaselineGeometry,
  projection: ProjectionName,
): Exclude<BaselineGeometry, "auto"> {
  if (geometry !== "auto") return geometry;
  return projection === "orthographic" ? "straight" : "geodesic";
}
