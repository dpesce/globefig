declare module "d3-geo-projection" {
  import type { GeoProjection, GeoRawProjection } from "d3-geo";

  interface GeoParallelProjection extends GeoProjection {
    parallel(): number;
    parallel(value: number): this;
  }

  export function geoArmadillo(): GeoParallelProjection;
  export function geoBonne(): GeoParallelProjection;
  export function geoCollignon(): GeoProjection;
  export const geoEckert4Raw: GeoRawProjection;
  export function geoHammer(): GeoProjection;
  export function geoHammerRaw(a: number, b?: number): GeoRawProjection;
  export function geoHammerRetroazimuthal(): GeoParallelProjection;
  export function geoInterruptedHomolosine(): GeoProjection;
  export function geoLoximuthal(): GeoParallelProjection;
  export function geoMollweide(): GeoProjection;
  export const geoMollweideRaw: GeoRawProjection;
  export function geoRectangularPolyconic(): GeoParallelProjection;
  export function geoRobinson(): GeoProjection;
  export function geoSinusoidal(): GeoProjection;
}
