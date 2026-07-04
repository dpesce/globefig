import type { MarkerShape } from "../types";

function polygonPath(points: Array<[number, number]>): string {
  return `${points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(3)},${y.toFixed(3)}`)
    .join(" ")} Z`;
}

export function markerPath(shape: MarkerShape, radius: number): string {
  switch (shape) {
    case "square":
      return `M${-radius},${-radius} H${radius} V${radius} H${-radius} Z`;
    case "diamond":
      return `M0,${-radius * 1.35} L${radius},0 L0,${radius * 1.35} L${-radius},0 Z`;
    case "triangle":
      return polygonPath([
        [0, -radius * 1.25],
        [radius * 1.08, radius * 0.7],
        [-radius * 1.08, radius * 0.7],
      ]);
    case "star": {
      const points: Array<[number, number]> = [];
      for (let index = 0; index < 10; index += 1) {
        const angle = -Math.PI / 2 + (index * Math.PI) / 5;
        const pointRadius = index % 2 === 0 ? radius * 1.35 : radius * 0.58;
        points.push([Math.cos(angle) * pointRadius, Math.sin(angle) * pointRadius]);
      }
      return polygonPath(points);
    }
    case "circle":
    default:
      return `M0,${-radius} A${radius},${radius} 0 1,1 0,${radius} A${radius},${radius} 0 1,1 0,${-radius} Z`;
  }
}
