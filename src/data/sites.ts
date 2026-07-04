import rawSites from "./sites.generated.json";
import type { TelescopeSite } from "../types";

export const SITES = rawSites as TelescopeSite[];
export const SITE_BY_ID = new Map(SITES.map((site) => [site.id, site]));
