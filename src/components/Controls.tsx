import { useState, type ReactNode } from "react";
import { PRESETS } from "../data/presets";
import { SITE_BY_ID, SITES } from "../data/sites";
import { PROJECTION_OPTIONS, resolveBaselineGeometry } from "../geo/projections";
import { applyPreset } from "../state/config";
import type {
  AppConfig,
  BaselineGeometry,
  MarkerShape,
  ProjectionName,
  StyleGroup,
} from "../types";
import { SiteSelector } from "./SiteSelector";

interface ControlsProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

interface SectionProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  open?: boolean;
}

function Section({ title, subtitle, children, open = false }: SectionProps) {
  return (
    <details className="control-section" open={open}>
      <summary>
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m5.75 7.5 4.25 4 4.25-4" />
        </svg>
      </summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <span className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span />
      </span>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-input-wrap">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <code>{value.toUpperCase()}</code>
      </span>
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-field">
      <span>
        {label}
        <output>
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {suffix}
        </output>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function updateGroup(
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>,
  groupId: string,
  patch: Partial<StyleGroup>,
) {
  setConfig((current) => ({
    ...current,
    groups: {
      ...current.groups,
      [groupId]: {
        ...current.groups[groupId],
        ...patch,
      },
    },
  }));
}

export function Controls({ config, setConfig }: ControlsProps) {
  const [editedGroupId, setEditedGroupId] = useState("eht");
  const [editedLabelSiteId, setEditedLabelSiteId] = useState("");
  const editedGroup = config.groups[editedGroupId] ?? config.groups.eht;
  const selectedSiteIds = Object.keys(config.selectedSites);
  const editableLabelSiteId = selectedSiteIds.includes(editedLabelSiteId)
    ? editedLabelSiteId
    : selectedSiteIds[0] ?? "";
  const editableLabelSite = SITE_BY_ID.get(editableLabelSiteId);
  const resolvedGeometry = resolveBaselineGeometry(
    config.baselines.geometry,
    config.projection.name,
  );

  return (
    <aside className="controls-panel" aria-label="Figure controls">
      <div className="controls-intro">
        <span className="eyebrow">Figure controls</span>
        <h2>Build the array</h2>
        <p>Every change is reflected directly in the publication canvas.</p>
      </div>

      <Section title="Telescopes" subtitle={`${selectedSiteIds.length} sites selected`} open>
        <label className="field">
          <span>Array preset</span>
          <select
            value=""
            onChange={(event) => {
              const preset = PRESETS.find((candidate) => candidate.id === event.target.value);
              if (preset) setConfig((current) => applyPreset(current, preset));
            }}
          >
            <option value="" disabled>
              Choose a preset…
            </option>
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <SiteSelector config={config} setConfig={setConfig} />
      </Section>

      <Section
        title="Projection"
        subtitle={PROJECTION_OPTIONS.find((item) => item.value === config.projection.name)?.label ?? ""}
        open
      >
        <label className="field">
          <span>Map projection</span>
          <select
            value={config.projection.name}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                projection: {
                  ...current.projection,
                  name: event.target.value as ProjectionName,
                },
              }))
            }
          >
            {PROJECTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small className="field-note">
            {PROJECTION_OPTIONS.find((item) => item.value === config.projection.name)?.note}
          </small>
        </label>
        <RangeField
          label="Center longitude"
          value={config.projection.centerLongitude}
          min={-180}
          max={180}
          step={1}
          suffix="°"
          onChange={(value) =>
            setConfig((current) => ({
              ...current,
              projection: { ...current.projection, centerLongitude: value },
            }))
          }
        />
        <RangeField
          label="Center latitude"
          value={config.projection.centerLatitude}
          min={-90}
          max={90}
          step={1}
          suffix="°"
          onChange={(value) =>
            setConfig((current) => ({
              ...current,
              projection: { ...current.projection, centerLatitude: value },
            }))
          }
        />
        {config.projection.name !== "orthographic" && config.projection.centerLatitude !== 0 && (
          <p className="field-note">
            A nonzero latitude rotates this global projection away from its conventional
            north-up aspect.
          </p>
        )}
      </Section>

      <Section
        title="Baselines"
        subtitle={config.baselines.enabled ? `${resolvedGeometry} connections` : "Hidden"}
      >
        <Switch
          label="Show baselines"
          checked={config.baselines.enabled}
          onChange={(enabled) =>
            setConfig((current) => ({
              ...current,
              baselines: { ...current.baselines, enabled },
            }))
          }
        />
        <label className="field">
          <span>Connection geometry</span>
          <select
            value={config.baselines.geometry}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                baselines: {
                  ...current.baselines,
                  geometry: event.target.value as BaselineGeometry,
                },
              }))
            }
          >
            <option value="auto">Auto</option>
            <option value="geodesic">Geodesic</option>
            <option value="straight">Projected straight</option>
          </select>
          <small className="field-note">
            Auto uses straight lines for orthographic and geodesics otherwise.
          </small>
        </label>
        <ColorField
          label="Line color"
          value={config.baselines.color}
          onChange={(color) =>
            setConfig((current) => ({
              ...current,
              baselines: { ...current.baselines, color },
            }))
          }
        />
        <RangeField
          label="Line width"
          value={config.baselines.width}
          min={0.25}
          max={6}
          step={0.25}
          suffix=" px"
          onChange={(width) =>
            setConfig((current) => ({
              ...current,
              baselines: { ...current.baselines, width },
            }))
          }
        />
        <RangeField
          label="Line opacity"
          value={config.baselines.opacity}
          min={0.02}
          max={1}
          step={0.02}
          onChange={(opacity) =>
            setConfig((current) => ({
              ...current,
              baselines: { ...current.baselines, opacity },
            }))
          }
        />
        <Switch
          label="Color by style group"
          checked={config.baselines.colorByGroup}
          onChange={(colorByGroup) =>
            setConfig((current) => ({
              ...current,
              baselines: { ...current.baselines, colorByGroup },
            }))
          }
        />
        <label className="field">
          <span>Focus telescope</span>
          <select
            value={config.baselines.focusSiteId ?? ""}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                baselines: {
                  ...current.baselines,
                  focusSiteId: event.target.value || null,
                },
              }))
            }
          >
            <option value="">None</option>
            {selectedSiteIds
              .map((id) => SITE_BY_ID.get(id))
              .filter((site): site is NonNullable<typeof site> => site !== undefined)
              .sort((first, second) => first.displayLabel.localeCompare(second.displayLabel))
              .map((site) => (
                <option key={site.id} value={site.id}>
                  {site.displayLabel}
                </option>
              ))}
          </select>
        </label>
        {config.baselines.focusSiteId && (
          <>
            <ColorField
              label="Focus color"
              value={config.baselines.focusColor}
              onChange={(focusColor) =>
                setConfig((current) => ({
                  ...current,
                  baselines: { ...current.baselines, focusColor },
                }))
              }
            />
            <RangeField
              label="Focus width"
              value={config.baselines.focusWidth}
              min={1}
              max={10}
              step={0.5}
              suffix=" px"
              onChange={(focusWidth) =>
                setConfig((current) => ({
                  ...current,
                  baselines: { ...current.baselines, focusWidth },
                }))
              }
            />
          </>
        )}
      </Section>

      <Section title="Markers" subtitle="Styles by telescope group">
        <label className="field">
          <span>Edit style group</span>
          <select value={editedGroupId} onChange={(event) => setEditedGroupId(event.target.value)}>
            {Object.values(config.groups).map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Marker shape</span>
          <select
            value={editedGroup.markerShape}
            onChange={(event) =>
              updateGroup(setConfig, editedGroupId, {
                markerShape: event.target.value as MarkerShape,
              })
            }
          >
            <option value="circle">Circle</option>
            <option value="square">Square</option>
            <option value="diamond">Diamond</option>
            <option value="triangle">Triangle</option>
            <option value="star">Star</option>
          </select>
        </label>
        <RangeField
          label="Marker radius"
          value={editedGroup.markerSize}
          min={2}
          max={24}
          step={1}
          suffix=" px"
          onChange={(markerSize) => updateGroup(setConfig, editedGroupId, { markerSize })}
        />
        <ColorField
          label="Marker fill"
          value={editedGroup.markerFill}
          onChange={(markerFill) => updateGroup(setConfig, editedGroupId, { markerFill })}
        />
        <ColorField
          label="Marker outline"
          value={editedGroup.markerStroke}
          onChange={(markerStroke) => updateGroup(setConfig, editedGroupId, { markerStroke })}
        />
        <RangeField
          label="Outline width"
          value={editedGroup.markerStrokeWidth}
          min={0}
          max={5}
          step={0.25}
          suffix=" px"
          onChange={(markerStrokeWidth) =>
            updateGroup(setConfig, editedGroupId, { markerStrokeWidth })
          }
        />
        <ColorField
          label="Group label color"
          value={editedGroup.labelColor}
          onChange={(labelColor) => updateGroup(setConfig, editedGroupId, { labelColor })}
        />
        <ColorField
          label="Group baseline color"
          value={editedGroup.baselineColor}
          onChange={(baselineColor) =>
            updateGroup(setConfig, editedGroupId, { baselineColor })
          }
        />
      </Section>

      <Section
        title="Labels"
        subtitle={config.labels.enabled ? "Visible · drag to reposition" : "Hidden"}
      >
        <Switch
          label="Show telescope labels"
          checked={config.labels.enabled}
          onChange={(enabled) =>
            setConfig((current) => ({
              ...current,
              labels: { ...current.labels, enabled },
            }))
          }
        />
        {selectedSiteIds.length > 0 && (
          <>
            <label className="field">
              <span>Edit station label</span>
              <select
                value={editableLabelSiteId}
                onChange={(event) => setEditedLabelSiteId(event.target.value)}
              >
                {selectedSiteIds
                  .map((id) => SITE_BY_ID.get(id))
                  .filter((site): site is NonNullable<typeof site> => site !== undefined)
                  .sort((first, second) =>
                    first.displayLabel.localeCompare(second.displayLabel),
                  )
                  .map((site) => (
                    <option key={site.id} value={site.id}>
                      {config.labelOverrides[site.id]?.trim() || site.displayLabel}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              <span>Label text</span>
              <input
                type="text"
                value={
                  editableLabelSite
                    ? config.labelOverrides[editableLabelSite.id] ??
                      editableLabelSite.displayLabel
                    : ""
                }
                onChange={(event) => {
                  if (!editableLabelSite) return;
                  setConfig((current) => ({
                    ...current,
                    labelOverrides: {
                      ...current.labelOverrides,
                      [editableLabelSite.id]: event.target.value,
                    },
                  }));
                }}
              />
            </label>
            <button
              type="button"
              className="secondary-button full-width"
              disabled={
                !editableLabelSite ||
                config.labelOverrides[editableLabelSite.id] === undefined
              }
              onClick={() => {
                if (!editableLabelSite) return;
                setConfig((current) => {
                  const labelOverrides = { ...current.labelOverrides };
                  delete labelOverrides[editableLabelSite.id];
                  return { ...current, labelOverrides };
                });
              }}
            >
              Restore catalog label
            </button>
          </>
        )}
        <label className="field">
          <span>Typeface</span>
          <select
            value={config.labels.fontFamily}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                labels: { ...current.labels, fontFamily: event.target.value },
              }))
            }
          >
            <option value="Arial, Helvetica, sans-serif">Arial / Helvetica</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="system-ui, sans-serif">System Sans</option>
          </select>
        </label>
        <RangeField
          label="Font size"
          value={config.labels.fontSize}
          min={8}
          max={64}
          step={1}
          suffix=" px"
          onChange={(fontSize) =>
            setConfig((current) => ({
              ...current,
              labels: { ...current.labels, fontSize },
            }))
          }
        />
        <label className="field">
          <span>Font weight</span>
          <select
            value={config.labels.fontWeight}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                labels: {
                  ...current.labels,
                  fontWeight: event.target.value as "400" | "600" | "700",
                },
              }))
            }
          >
            <option value="400">Regular</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </select>
        </label>
        <Switch
          label="Use group label colors"
          checked={config.labels.useGroupColors}
          onChange={(useGroupColors) =>
            setConfig((current) => ({
              ...current,
              labels: { ...current.labels, useGroupColors },
            }))
          }
        />
        {!config.labels.useGroupColors && (
          <ColorField
            label="Label color"
            value={config.labels.color}
            onChange={(color) =>
              setConfig((current) => ({
                ...current,
                labels: { ...current.labels, color },
              }))
            }
          />
        )}
        <Switch
          label="Text halo"
          checked={config.labels.haloEnabled}
          onChange={(haloEnabled) =>
            setConfig((current) => ({
              ...current,
              labels: { ...current.labels, haloEnabled },
            }))
          }
        />
        {config.labels.haloEnabled && (
          <>
            <ColorField
              label="Halo color"
              value={config.labels.haloColor}
              onChange={(haloColor) =>
                setConfig((current) => ({
                  ...current,
                  labels: { ...current.labels, haloColor },
                }))
              }
            />
            <RangeField
              label="Halo width"
              value={config.labels.haloWidth}
              min={1}
              max={12}
              step={0.5}
              suffix=" px"
              onChange={(haloWidth) =>
                setConfig((current) => ({
                  ...current,
                  labels: { ...current.labels, haloWidth },
                }))
              }
            />
          </>
        )}
        <Switch
          label="Leader lines for moved labels"
          checked={config.labels.showLeaderLines}
          onChange={(showLeaderLines) =>
            setConfig((current) => ({
              ...current,
              labels: { ...current.labels, showLeaderLines },
            }))
          }
        />
        <button
          type="button"
          className="secondary-button full-width"
          disabled={Object.keys(config.labelOffsets).length === 0}
          onClick={() => setConfig((current) => ({ ...current, labelOffsets: {} }))}
        >
          Reset manual label positions
        </button>
      </Section>

      <Section title="Globe & canvas" subtitle={`${config.figure.width} × ${config.figure.height} px`}>
        <Switch
          label="Satellite imagery"
          checked={config.map.showRaster}
          onChange={(showRaster) =>
            setConfig((current) => ({
              ...current,
              map: { ...current.map, showRaster },
            }))
          }
        />
        {config.map.showRaster && (
          <RangeField
            label="Imagery opacity"
            value={config.map.rasterOpacity}
            min={0}
            max={1}
            step={0.05}
            onChange={(rasterOpacity) =>
              setConfig((current) => ({
                ...current,
                map: { ...current.map, rasterOpacity },
              }))
            }
          />
        )}
        <Switch
          label="Graticule"
          checked={config.map.showGraticule}
          onChange={(showGraticule) =>
            setConfig((current) => ({
              ...current,
              map: { ...current.map, showGraticule },
            }))
          }
        />
        <ColorField
          label="Globe border"
          value={config.map.borderColor}
          onChange={(borderColor) =>
            setConfig((current) => ({
              ...current,
              map: { ...current.map, borderColor },
            }))
          }
        />
        <RangeField
          label="Border width"
          value={config.map.borderWidth}
          min={0}
          max={12}
          step={0.5}
          suffix=" px"
          onChange={(borderWidth) =>
            setConfig((current) => ({
              ...current,
              map: { ...current.map, borderWidth },
            }))
          }
        />
        <Switch
          label="Transparent background"
          checked={config.figure.transparent}
          onChange={(transparent) =>
            setConfig((current) => ({
              ...current,
              figure: { ...current.figure, transparent },
            }))
          }
        />
        {!config.figure.transparent && (
          <ColorField
            label="Canvas background"
            value={config.figure.background}
            onChange={(background) =>
              setConfig((current) => ({
                ...current,
                figure: { ...current.figure, background },
              }))
            }
          />
        )}
        <div className="dimension-grid">
          <label className="field">
            <span>Width</span>
            <input
              type="number"
              min={600}
              max={6000}
              step={10}
              value={config.figure.width}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  figure: {
                    ...current.figure,
                    width: Math.min(6000, Math.max(600, Number(event.target.value))),
                  },
                }))
              }
            />
          </label>
          <label className="field">
            <span>Height</span>
            <input
              type="number"
              min={300}
              max={4000}
              step={10}
              value={config.figure.height}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  figure: {
                    ...current.figure,
                    height: Math.min(4000, Math.max(300, Number(event.target.value))),
                  },
                }))
              }
            />
          </label>
        </div>
        <div className="size-presets">
          {[
            [1500, 786, "Reference"],
            [2400, 1200, "2:1 print"],
            [3840, 2160, "4K slide"],
          ].map(([width, height, label]) => (
            <button
              type="button"
              className="chip-button"
              key={label}
              onClick={() =>
                setConfig((current) => ({
                  ...current,
                  figure: {
                    ...current.figure,
                    width: Number(width),
                    height: Number(height),
                  },
                }))
              }
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <div className="catalog-note">
        <span>Catalog</span>
        <strong>{SITES.length} sites</strong>
        <small>ngEHT simulation catalog snapshot · 2025-11-28</small>
      </div>
    </aside>
  );
}
