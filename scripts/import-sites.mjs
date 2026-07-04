import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "data/Telescope_Site_Matrix.csv");
const overridesPath = resolve(root, "data/site-overrides.json");
const outputPath = resolve(root, "src/data/sites.generated.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

const csvText = (await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "");
const [headers, ...rows] = parseCsv(csvText);
const overrides = JSON.parse(await readFile(overridesPath, "utf8"));

const normalizedHeaders = headers.map((header) => header.trim());
const records = rows.map((values) =>
  Object.fromEntries(normalizedHeaders.map((header, index) => [header, values[index]?.trim() ?? ""])),
);

const sites = records
  .map((record) => {
    const override = overrides.sites[record.Name] ?? {};
    return {
      id: record.Name,
      code: record.Two_letter_code,
      name: record.Notes || record.Name,
      displayLabel: override.displayLabel ?? record.Name,
      country: record.Country,
      latitude: Number(record.Latitude),
      longitude: Number(record.Longitude),
      elevation: record.Elevation === "" ? null : Number(record.Elevation),
      diameter: record.Diameter === "" ? null : Number(record.Diameter),
      aliases: [
        ...new Set([
          ...(record.Alternative_names
            ? record.Alternative_names.split(";").map((alias) => alias.trim()).filter(Boolean)
            : []),
          ...(override.aliases ?? []),
        ]),
      ],
      defaultGroup: override.defaultGroup ?? "other",
    };
  })
  .sort((a, b) => a.displayLabel.localeCompare(b.displayLabel));

const ids = new Set();
for (const site of sites) {
  if (ids.has(site.id)) throw new Error(`Duplicate site id: ${site.id}`);
  ids.add(site.id);
  if (!Number.isFinite(site.latitude) || site.latitude < -90 || site.latitude > 90) {
    throw new Error(`Invalid latitude for ${site.id}`);
  }
  if (!Number.isFinite(site.longitude) || site.longitude < -180 || site.longitude > 180) {
    throw new Error(`Invalid longitude for ${site.id}`);
  }
}

await writeFile(outputPath, `${JSON.stringify(sites, null, 2)}\n`);
console.log(`Wrote ${sites.length} normalized sites to ${outputPath}`);
