import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  geoGraticule10,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import worldCountries from "../data/world-countries-110m.json";
import {
  baselineStyleGroupId,
  buildBaselinePairs,
} from "../geo/baselines";
import { placeLabels } from "../geo/labels";
import {
  createProjection,
  isSiteVisible,
  resolveBaselineGeometry,
  SPHERE,
} from "../geo/projections";
import { SITE_BY_ID, SITES } from "../data/sites";
import { markerPath } from "../render/markers";
import { isRasterBackground } from "../render/raster";
import type {
  AppConfig,
  LabelPlacement,
  ProjectedSite,
  TelescopeSite,
} from "../types";
import { RasterLayer } from "./RasterLayer";

interface GlobeFigureProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

interface DragState {
  siteId: string;
  startX: number;
  startY: number;
  initialDx: number;
  initialDy: number;
  anchor: LabelPlacement["anchor"];
}

interface CountryFeature {
  type: "Feature";
  properties: {
    ADMIN?: string;
    CONTINENT?: string;
  };
  geometry: GeoPermissibleObjects;
}

const COUNTRY_FEATURES = (
  worldCountries as unknown as { features: CountryFeature[] }
).features;

const BORDER_MAP_GRATICULE_COLOR = "#555b61";
const BORDER_MAP_GRATICULE_MIN_OPACITY = 0.52;

function isIceFeature(feature: CountryFeature): boolean {
  return (
    feature.properties.CONTINENT === "Antarctica" ||
    feature.properties.ADMIN === "Greenland"
  );
}

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): [number, number] {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const transformed = point.matrixTransform(svg.getScreenCTM()?.inverse());
  return [transformed.x, transformed.y];
}

export const GlobeFigure = forwardRef<SVGSVGElement, GlobeFigureProps>(
  function GlobeFigure({ config, setConfig }, forwardedRef) {
    const localSvgRef = useRef<SVGSVGElement | null>(null);
    const dragRef = useRef<DragState | null>(null);
    const [rasterRendering, setRasterRendering] = useState(false);
    const projection = useMemo(
      () => createProjection(config.projection, config.figure.width, config.figure.height),
      [config.figure.height, config.figure.width, config.projection],
    );
    const path = useMemo(() => geoPath(projection), [projection]);

    const selectedSites = useMemo(
      () =>
        SITES.filter((site) => config.selectedSites[site.id] !== undefined),
      [config.selectedSites],
    );

    const projectedSites = useMemo<ProjectedSite[]>(
      () =>
        selectedSites.map((site) => {
          const point = projection([site.longitude, site.latitude]);
          const groupId = config.selectedSites[site.id];
          return {
            site,
            label:
              config.labelOverrides[site.id]?.trim() || site.displayLabel,
            x: point?.[0] ?? 0,
            y: point?.[1] ?? 0,
            visible: point !== null && isSiteVisible(site, config.projection, projection),
            group: config.groups[groupId] ?? config.groups.other,
          };
        }),
      [
        config.groups,
        config.labelOverrides,
        config.projection,
        config.selectedSites,
        projection,
        selectedSites,
      ],
    );
    const projectedById = useMemo(
      () => new Map(projectedSites.map((entry) => [entry.site.id, entry])),
      [projectedSites],
    );
    const pairs = useMemo(() => buildBaselinePairs(selectedSites), [selectedSites]);
    const geometry = resolveBaselineGeometry(
      config.baselines.geometry,
      config.projection.name,
    );
    const rasterBackground = isRasterBackground(config.map.backgroundStyle);
    const labelPlacements = useMemo(
      () => placeLabels(projectedSites, config),
      [config, projectedSites],
    );
    const labelsById = useMemo(
      () => new Map(labelPlacements.map((placement) => [placement.siteId, placement])),
      [labelPlacements],
    );

    const assignSvgRef = useCallback(
      (node: SVGSVGElement | null) => {
        localSvgRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const beginLabelDrag = (
      event: ReactPointerEvent<SVGTextElement>,
      entry: ProjectedSite,
      placement: LabelPlacement,
    ) => {
      const svg = localSvgRef.current;
      if (!svg) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      const [startX, startY] = toSvgPoint(svg, event.clientX, event.clientY);
      dragRef.current = {
        siteId: entry.site.id,
        startX,
        startY,
        initialDx: placement.x - entry.x,
        initialDy: placement.y - entry.y,
        anchor: placement.anchor,
      };
    };

    const moveLabel = (event: ReactPointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      const svg = localSvgRef.current;
      if (!drag || !svg) return;
      const [x, y] = toSvgPoint(svg, event.clientX, event.clientY);
      setConfig((current) => ({
        ...current,
        labelOffsets: {
          ...current.labelOffsets,
          [drag.siteId]: {
            dx: drag.initialDx + x - drag.startX,
            dy: drag.initialDy + y - drag.startY,
            anchor: drag.anchor,
          },
        },
      }));
    };

    const endLabelDrag = () => {
      dragRef.current = null;
    };

    const setFocusSite = (site: TelescopeSite) => {
      setConfig((current) => ({
        ...current,
        baselines: {
          ...current.baselines,
          focusSiteId:
            current.baselines.focusSiteId === site.id ? null : site.id,
        },
      }));
    };

    const centerOnSite = (site: TelescopeSite) => {
      setConfig((current) => ({
        ...current,
        projection: {
          ...current.projection,
          centerLongitude: site.longitude,
          centerLatitude: site.latitude,
        },
        baselines: {
          ...current.baselines,
          focusSiteId: site.id,
        },
      }));
    };

    return (
      <div
        className="figure-stage"
        style={{
          aspectRatio: `${config.figure.width} / ${config.figure.height}`,
          background: config.figure.transparent ? "transparent" : config.figure.background,
        }}
      >
        <RasterLayer config={config} onRenderingChange={setRasterRendering} />
        <svg
          ref={assignSvgRef}
          className="figure-overlay"
          viewBox={`0 0 ${config.figure.width} ${config.figure.height}`}
          role="img"
          aria-label={`Map with ${selectedSites.length} selected telescopes and ${pairs.length} baselines`}
          onPointerMove={moveLabel}
          onPointerUp={endLabelDrag}
          onPointerCancel={endLabelDrag}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setConfig((current) => ({
                ...current,
                baselines: { ...current.baselines, focusSiteId: null },
              }));
            }
          }}
        >
          <path
            d={path(SPHERE) ?? undefined}
            fill={
              rasterBackground
                ? "transparent"
                : config.map.backgroundStyle === "three-color"
                  ? "#4f9fca"
                  : "#f7f7f4"
            }
            className="sphere-fill"
          />
          {!rasterBackground && (
            <g className="vector-globe-background" pointerEvents="none">
              {COUNTRY_FEATURES.map((feature, index) => (
                <path
                  key={`${feature.properties.ADMIN ?? "country"}-${index}`}
                  d={path(feature as unknown as GeoPermissibleObjects) ?? undefined}
                  fill={
                    config.map.backgroundStyle === "three-color"
                      ? isIceFeature(feature)
                        ? "#ffffff"
                        : "#6ca45f"
                      : "#f7f7f4"
                  }
                  stroke={
                    config.map.backgroundStyle === "borders" ? "#17191c" : "none"
                  }
                  strokeWidth={
                    config.map.backgroundStyle === "borders" ? 0.75 : undefined
                  }
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )}
          {config.map.showGraticule && (
            <path
              d={path(geoGraticule10()) ?? undefined}
              fill="none"
              stroke={
                config.map.backgroundStyle === "borders"
                  ? BORDER_MAP_GRATICULE_COLOR
                  : config.map.graticuleColor
              }
              strokeWidth={0.7}
              opacity={
                config.map.backgroundStyle === "borders"
                  ? Math.max(
                      config.map.graticuleOpacity,
                      BORDER_MAP_GRATICULE_MIN_OPACITY,
                    )
                  : config.map.graticuleOpacity
              }
              className="graticule"
              pointerEvents="none"
            />
          )}
          {config.baselines.enabled && (
            <g className="baselines" fill="none" pointerEvents="none">
              {pairs.map((pair) => {
                const first = projectedById.get(pair.first.id);
                const second = projectedById.get(pair.second.id);
                if (!first || !second) return null;
                if (geometry === "straight" && (!first.visible || !second.visible)) return null;
                const focused =
                  pair.firstSiteIds.includes(config.baselines.focusSiteId ?? "") ||
                  pair.secondSiteIds.includes(config.baselines.focusSiteId ?? "");
                const groupId = baselineStyleGroupId(pair, config.selectedSites);
                const group = groupId ? config.groups[groupId] : null;
                const color = focused
                  ? config.baselines.focusColor
                  : config.baselines.colorByGroup && group
                    ? group.baselineColor
                    : config.baselines.color;
                const opacity = focused
                  ? config.baselines.focusOpacity
                  : config.baselines.colorByGroup && group
                    ? group.baselineOpacity
                    : config.baselines.opacity;
                const width = focused
                  ? config.baselines.focusWidth
                  : config.baselines.colorByGroup && group
                    ? group.baselineWidth
                    : config.baselines.width;
                const key = `${pair.firstSiteIds.join("+")}-${pair.secondSiteIds.join("+")}`;

                if (geometry === "straight") {
                  return (
                    <line
                      key={key}
                      x1={first.x}
                      y1={first.y}
                      x2={second.x}
                      y2={second.y}
                      stroke={color}
                      strokeWidth={width}
                      opacity={opacity}
                    />
                  );
                }

                return (
                  <path
                    key={key}
                    d={
                      path({
                        type: "LineString",
                        coordinates: [
                          [pair.first.longitude, pair.first.latitude],
                          [pair.second.longitude, pair.second.latitude],
                        ],
                      }) ?? undefined
                    }
                    stroke={color}
                    strokeWidth={width}
                    opacity={opacity}
                  />
                );
              })}
            </g>
          )}
          {config.labels.enabled && config.labels.showLeaderLines && (
            <g className="label-leaders" pointerEvents="none">
              {projectedSites.map((entry) => {
                const placement = labelsById.get(entry.site.id);
                if (!entry.visible || !placement?.manual) return null;
                return (
                  <line
                    key={entry.site.id}
                    x1={entry.x}
                    y1={entry.y}
                    x2={placement.x}
                    y2={placement.y}
                    stroke={
                      config.labels.useGroupColors
                        ? entry.group.labelColor
                        : config.labels.color
                    }
                    strokeWidth={1}
                    opacity={0.65}
                  />
                );
              })}
            </g>
          )}
          <g className="site-markers">
            {projectedSites.map((entry) => {
              if (!entry.visible) return null;
              const focused = config.baselines.focusSiteId === entry.site.id;
              return (
                <path
                  key={entry.site.id}
                  d={markerPath(entry.group.markerShape, entry.group.markerSize)}
                  transform={`translate(${entry.x} ${entry.y})`}
                  fill={focused ? config.baselines.focusColor : entry.group.markerFill}
                  stroke={entry.group.markerStroke}
                  strokeWidth={entry.group.markerStrokeWidth}
                  className="site-marker"
                  onClick={(event) => {
                    event.stopPropagation();
                    setFocusSite(entry.site);
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    centerOnSite(entry.site);
                  }}
                  role="button"
                  aria-label={`Focus ${entry.label}`}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setFocusSite(entry.site);
                  }}
                >
                  <title>
                    {entry.label} · {entry.site.name} · {entry.site.country} · Double-click
                    to center
                  </title>
                </path>
              );
            })}
          </g>
          <path
            d={path(SPHERE) ?? undefined}
            fill="none"
            stroke={config.map.borderColor}
            strokeWidth={config.map.borderWidth}
            pointerEvents="none"
            className="globe-border"
          />
          {config.labels.enabled && (
            <g className="site-labels">
              {projectedSites.map((entry) => {
                const placement = labelsById.get(entry.site.id);
                if (!entry.visible || !placement) return null;
                const color = config.labels.useGroupColors
                  ? entry.group.labelColor
                  : config.labels.color;
                return (
                  <text
                    key={entry.site.id}
                    x={placement.x}
                    y={placement.y}
                    textAnchor={placement.anchor}
                    fill={color}
                    stroke={config.labels.haloEnabled ? config.labels.haloColor : "none"}
                    strokeWidth={config.labels.haloEnabled ? config.labels.haloWidth : 0}
                    paintOrder="stroke"
                    strokeLinejoin="round"
                    fontFamily={config.labels.fontFamily}
                    fontSize={config.labels.fontSize}
                    fontWeight={config.labels.fontWeight}
                    className="site-label"
                    onPointerDown={(event) => beginLabelDrag(event, entry, placement)}
                  >
                    {entry.label}
                  </text>
                );
              })}
            </g>
          )}
        </svg>
        {selectedSites.length === 0 && (
          <div className="figure-empty">
            <span className="eyebrow">Blank globe</span>
            <strong>Select an array preset or choose telescopes</strong>
          </div>
        )}
        {rasterRendering && (
          <div className="render-status" role="status">
            <span className="spinner" />
            Projecting imagery
          </div>
        )}
        <div className="figure-meta" aria-hidden="true">
          <span>{selectedSites.length} sites</span>
          <span>{pairs.length} baselines</span>
          <span>
            {geometry === "geodesic" ? "geodesic" : "straight"} connections
          </span>
        </div>
      </div>
    );
  },
);

export function selectedSiteLabel(config: AppConfig): string {
  if (!config.baselines.focusSiteId) return "None";
  return SITE_BY_ID.get(config.baselines.focusSiteId)?.displayLabel ?? "None";
}
