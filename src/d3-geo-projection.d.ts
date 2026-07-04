declare module "d3-geo-projection" {
  import type { GeoProjection } from "d3-geo";

  export function geoHammer(): GeoProjection;
  export function geoMollweide(): GeoProjection;
  export function geoRobinson(): GeoProjection;
}
