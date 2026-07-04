import { useMemo, useState } from "react";
import { SITES } from "../data/sites";
import type { AppConfig, TelescopeSite } from "../types";

interface SiteSelectorProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

function matchesSearch(site: TelescopeSite, search: string): boolean {
  const haystack = [
    site.id,
    site.code,
    site.displayLabel,
    site.name,
    site.country,
    ...site.aliases,
  ]
    .join(" ")
    .toLocaleLowerCase();
  return haystack.includes(search.toLocaleLowerCase());
}

export function SiteSelector({ config, setConfig }: SiteSelectorProps) {
  const [search, setSearch] = useState("");
  const filteredSites = useMemo(() => {
    const matching = search.trim()
      ? SITES.filter((site) => matchesSearch(site, search.trim()))
      : SITES;
    return [...matching].sort((first, second) => {
      const selectedDifference =
        Number(config.selectedSites[second.id] !== undefined) -
        Number(config.selectedSites[first.id] !== undefined);
      return (
        selectedDifference ||
        first.displayLabel.localeCompare(second.displayLabel)
      );
    });
  }, [config.selectedSites, search]);

  const toggleSite = (site: TelescopeSite, selected: boolean) => {
    setConfig((current) => {
      const selectedSites = { ...current.selectedSites };
      if (selected) {
        selectedSites[site.id] = current.groups[site.defaultGroup]
          ? site.defaultGroup
          : "other";
      } else {
        delete selectedSites[site.id];
      }
      const labelOffsets = { ...current.labelOffsets };
      if (!selected) delete labelOffsets[site.id];
      return {
        ...current,
        selectedSites,
        labelOffsets,
        baselines:
          !selected && current.baselines.focusSiteId === site.id
            ? { ...current.baselines, focusSiteId: null }
            : current.baselines,
      };
    });
  };

  return (
    <div className="site-selector">
      <div className="site-search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z" />
        </svg>
        <input
          type="search"
          placeholder="Search name, code, or country"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search telescope sites"
        />
      </div>
      <div className="site-selector-tools">
        <span>{Object.keys(config.selectedSites).length} selected</span>
        <div>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setConfig((current) => ({
                ...current,
                selectedSites: Object.fromEntries(
                  SITES.map((site) => [
                    site.id,
                    current.groups[site.defaultGroup] ? site.defaultGroup : "other",
                  ]),
                ),
                labelOffsets: {},
              }))
            }
          >
            Select all
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setConfig((current) => ({
                ...current,
                selectedSites: {},
                labelOffsets: {},
                baselines: { ...current.baselines, focusSiteId: null },
              }))
            }
          >
            Clear
          </button>
        </div>
      </div>
      <div className="site-list" role="list">
        {filteredSites.map((site) => {
          const groupId = config.selectedSites[site.id];
          const selected = groupId !== undefined;
          return (
            <div className={`site-row ${selected ? "selected" : ""}`} key={site.id}>
              <label className="site-check">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => toggleSite(site, event.target.checked)}
                />
                <span className="custom-check" />
                <span className="site-copy">
                  <strong>{site.displayLabel}</strong>
                  <small>
                    {site.name === site.displayLabel ? site.country : site.name}
                  </small>
                </span>
              </label>
              {selected && (
                <select
                  className="group-select"
                  value={groupId}
                  aria-label={`Style group for ${site.displayLabel}`}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      selectedSites: {
                        ...current.selectedSites,
                        [site.id]: event.target.value,
                      },
                    }))
                  }
                >
                  {Object.values(config.groups).map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
        {filteredSites.length === 0 && (
          <div className="no-results">No sites match “{search}”.</div>
        )}
      </div>
    </div>
  );
}
