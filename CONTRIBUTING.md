# Contributing to GlobeFig

## Local setup

GlobeFig requires Node.js 22 or a compatible current LTS release.

```sh
npm install
npm run dev
```

The development site is served at
`http://localhost:5173/globefig/`.

## Before opening a pull request

Run the complete local check:

```sh
npm run check
```

This executes the unit tests, TypeScript compiler, and production build.

Pull requests should:

- Describe the user-visible behavior being changed.
- Keep figure configuration backward-compatible when practical.
- Add or update tests for projection, catalog, baseline, or state changes.
- Include browser verification for visual or interaction changes.
- Avoid editing `src/data/sites.generated.json` directly.

## Telescope data

Update `data/Telescope_Site_Matrix.csv`, then regenerate the browser catalog:

```sh
npm run import:sites
```

Legacy aliases and display names belong in `data/site-overrides.json`. Array
membership presets belong in `src/data/presets.ts`.

## Reporting issues

Use the repository issue templates for reproducible bugs and feature requests.
For rendering bugs, include the projection, selected sites or preset, browser,
and an exported project JSON file when possible.
