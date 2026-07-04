# GlobeFig

[![CI](https://github.com/dpesce/globefig/actions/workflows/ci.yml/badge.svg)](https://github.com/dpesce/globefig/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/dpesce/globefig/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/dpesce/globefig/actions/workflows/deploy-pages.yml)

GlobeFig is a browser-based editor for producing publication-ready maps of
EHT, ngEHT, and other telescope arrays. It replaces the legacy
Matplotlib/Basemap scripts with a static application that runs entirely in the
browser and can be hosted on GitHub Pages.

**Website:** [dpesce.github.io/globefig](https://dpesce.github.io/globefig/)

## Features

- Hammer–Aitoff, orthographic, Mollweide, and Robinson projections
- Searchable 115-site telescope catalog and observing-array presets
- Great-circle and projected-straight baselines
- Per-group marker, label, and baseline styles
- Automatic label placement with direct drag and text editing
- Physical-site baseline deduplication for ALMA/APEX and JCMT/SMA
- Focus-site baseline highlighting
- PNG, editable SVG, and versioned project-JSON exports
- Complete figure configurations encoded in shareable URLs
- Responsive interface with no server or Python runtime

## Development

Requirements: Node.js 22 or a compatible current LTS release.

```sh
npm install
npm run dev
```

Run all checks:

```sh
npm run check
```

Create a production bundle:

```sh
npm run build
```

## Data maintenance

The normalized browser catalog is generated from
[`data/Telescope_Site_Matrix.csv`](data/Telescope_Site_Matrix.csv):

```sh
npm run import:sites
```

Legacy aliases, display labels, and default visual groups are deliberately
kept in [`data/site-overrides.json`](data/site-overrides.json). That is the
small domain-reviewable file to update when naming or array membership changes.
Catalog provenance is documented in [`data/README.md`](data/README.md).

Array presets are defined separately in
[`src/data/presets.ts`](src/data/presets.ts), because array membership changes
more frequently than site coordinates.

## Rendering architecture

The preview combines a Canvas raster layer with an SVG interaction layer.
Satellite imagery is inverse-projected into the selected map projection.
Baselines, markers, graticules, and labels remain vectors. PNG export composites
the layers at the requested dimensions; SVG export embeds the projected raster
while preserving the overlays as editable vectors.

## GitHub Pages

The Vite base path is configured for
[https://dpesce.github.io/globefig/](https://dpesce.github.io/globefig/).
Enable **Settings → Pages → GitHub Actions** in the repository. Pushes to
`main` then build, test, and deploy automatically.

## Imagery

The globe raster is an optimized derivative of the `world_true_color.tif`
asset used by the supplied legacy scripts. It corresponds to NASA Visible
Earth's Blue Marble family of true-color global mosaics. See
[`public/ATTRIBUTION.txt`](public/ATTRIBUTION.txt).

## Contributing

Bug reports and focused improvements are welcome. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the local workflow and pull-request
expectations.

## License

GlobeFig is released under the [MIT License](LICENSE). Telescope catalog and
imagery attribution are documented separately.
