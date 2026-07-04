import type { AppConfig } from "../types";
import { renderProjectedRaster } from "../render/raster";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(`Unable to encode ${type}.`));
    }, type);
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

function serializeOverlay(svg: SVGSVGElement, config: AppConfig): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(config.figure.width));
  clone.setAttribute("height", String(config.figure.height));
  clone.removeAttribute("role");
  clone.removeAttribute("aria-label");
  clone.querySelectorAll("[tabindex]").forEach((element) => element.removeAttribute("tabindex"));
  return new XMLSerializer().serializeToString(clone);
}

function svgStringToImage(svgMarkup: string): Promise<HTMLImageElement> {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to render the SVG overlay."));
    };
    image.src = url;
  });
}

async function createRasterForExport(config: AppConfig): Promise<HTMLCanvasElement | null> {
  if (!config.map.showRaster) return null;
  const rasterWidth = Math.min(2400, config.figure.width);
  return renderProjectedRaster({
    projection: config.projection,
    logicalWidth: config.figure.width,
    logicalHeight: config.figure.height,
    outputWidth: rasterWidth,
    outputHeight: Math.round(rasterWidth * (config.figure.height / config.figure.width)),
    yieldDuringRender: true,
  });
}

function fillBackground(context: CanvasRenderingContext2D, config: AppConfig): void {
  if (config.figure.transparent) return;
  context.fillStyle = config.figure.background;
  context.fillRect(0, 0, config.figure.width, config.figure.height);
}

export async function exportPng(
  svg: SVGSVGElement,
  config: AppConfig,
): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = config.figure.width;
  canvas.height = config.figure.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  fillBackground(context, config);

  const raster = await createRasterForExport(config);
  if (raster) {
    context.save();
    context.globalAlpha = config.map.rasterOpacity;
    context.drawImage(raster, 0, 0, canvas.width, canvas.height);
    context.restore();
  }

  const overlay = await svgStringToImage(serializeOverlay(svg, config));
  context.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  downloadBlob(await canvasToBlob(canvas), "globefig.png");
}

export async function exportSvg(
  svg: SVGSVGElement,
  config: AppConfig,
): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(config.figure.width));
  clone.setAttribute("height", String(config.figure.height));
  clone.removeAttribute("role");
  clone.removeAttribute("aria-label");

  if (!config.figure.transparent) {
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", config.figure.background);
    clone.prepend(background);
  }

  const raster = await createRasterForExport(config);
  if (raster) {
    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttribute("width", String(config.figure.width));
    image.setAttribute("height", String(config.figure.height));
    image.setAttribute("href", canvasToDataUrl(raster));
    image.setAttribute("opacity", String(config.map.rasterOpacity));
    const background = clone.querySelector("rect");
    if (background) background.after(image);
    else clone.prepend(image);
  }

  const markup = new XMLSerializer().serializeToString(clone);
  downloadBlob(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }), "globefig.svg");
}

export function exportConfig(config: AppConfig): void {
  downloadBlob(
    new Blob([`${JSON.stringify(config, null, 2)}\n`], {
      type: "application/json;charset=utf-8",
    }),
    "globefig-project.json",
  );
}
