import type {
  AppConfig,
  LabelPlacement,
  ProjectedSite,
  StyleGroup,
} from "../types";

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const DIRECTIONS = [
  { x: 1, y: -1, anchor: "start" as const },
  { x: 1, y: 1, anchor: "start" as const },
  { x: -1, y: -1, anchor: "end" as const },
  { x: -1, y: 1, anchor: "end" as const },
  { x: 1, y: 0, anchor: "start" as const },
  { x: -1, y: 0, anchor: "end" as const },
  { x: 0, y: -1, anchor: "middle" as const },
  { x: 0, y: 1, anchor: "middle" as const },
];

function overlapArea(first: Box, second: Box): number {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  return width * height;
}

function placementBox(
  x: number,
  y: number,
  width: number,
  height: number,
  anchor: LabelPlacement["anchor"],
): Box {
  const left = anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2;
  return {
    left,
    right: left + width,
    top: y - height * 0.8,
    bottom: y + height * 0.25,
  };
}

function groupOrder(group: StyleGroup): number {
  if (group.id === "ngeht") return 0;
  if (group.id === "eht") return 1;
  return 2;
}

export function placeLabels(
  projectedSites: ProjectedSite[],
  config: AppConfig,
): LabelPlacement[] {
  const placedBoxes: Box[] = [];
  const visibleSites = projectedSites
    .filter((entry) => entry.visible)
    .sort(
      (first, second) =>
        groupOrder(first.group) - groupOrder(second.group) ||
        first.site.displayLabel.localeCompare(second.site.displayLabel),
    );

  return visibleSites.map((entry) => {
    const textWidth = Math.max(
      config.labels.fontSize * 1.8,
      entry.site.displayLabel.length * config.labels.fontSize * 0.62,
    );
    const textHeight = config.labels.fontSize * 1.18;
    const manualOffset = config.labelOffsets[entry.site.id];

    if (manualOffset) {
      const x = entry.x + manualOffset.dx;
      const y = entry.y + manualOffset.dy;
      const anchor =
        Math.abs(manualOffset.dx) < 4 ? "middle" : manualOffset.dx < 0 ? "end" : "start";
      const box = placementBox(x, y, textWidth, textHeight, anchor);
      placedBoxes.push(box);
      return {
        siteId: entry.site.id,
        x,
        y,
        anchor,
        width: textWidth,
        height: textHeight,
        manual: true,
      };
    }

    const gap = entry.group.markerSize + 6;
    let best:
      | {
          x: number;
          y: number;
          anchor: LabelPlacement["anchor"];
          box: Box;
          score: number;
        }
      | undefined;

    for (const direction of DIRECTIONS) {
      const x = entry.x + direction.x * gap;
      const y =
        entry.y +
        direction.y * (gap + textHeight * 0.32) +
        (direction.y === 0 ? textHeight * 0.12 : 0);
      const box = placementBox(x, y, textWidth, textHeight, direction.anchor);
      const collision = placedBoxes.reduce((sum, other) => sum + overlapArea(box, other), 0);
      const overflow =
        Math.max(0, -box.left) +
        Math.max(0, box.right - config.figure.width) +
        Math.max(0, -box.top) +
        Math.max(0, box.bottom - config.figure.height);
      const score = collision * 100 + overflow * 20;
      if (!best || score < best.score) {
        best = { x, y, anchor: direction.anchor, box, score };
      }
      if (score === 0) break;
    }

    const selected = best ?? {
      x: entry.x + gap,
      y: entry.y - gap,
      anchor: "start" as const,
      box: placementBox(entry.x + gap, entry.y - gap, textWidth, textHeight, "start"),
      score: 0,
    };
    placedBoxes.push(selected.box);
    return {
      siteId: entry.site.id,
      x: selected.x,
      y: selected.y,
      anchor: selected.anchor,
      width: textWidth,
      height: textHeight,
      manual: false,
    };
  });
}
