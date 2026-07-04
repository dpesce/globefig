import { geoDistance, geoPath } from "d3-geo";
import { createProjection, SPHERE } from "../geo/projections";
import type { AppConfig, GlobeBackground } from "../types";

const RASTER_URLS: Partial<Record<GlobeBackground, string>> = {
  satellite: `${import.meta.env.BASE_URL}assets/earth-blue-marble.webp`,
  "shaded-relief": `${import.meta.env.BASE_URL}assets/earth-shaded-relief.webp`,
};

interface SourceRaster {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

interface RasterRenderOptions {
  projection: AppConfig["projection"];
  logicalWidth: number;
  logicalHeight: number;
  outputWidth: number;
  outputHeight: number;
  backgroundStyle: GlobeBackground;
  shouldCancel?: () => boolean;
  yieldDuringRender?: boolean;
}

const sourcePromises = new Map<GlobeBackground, Promise<SourceRaster>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load raster asset: ${url}`));
    image.src = url;
  });
}

export function isRasterBackground(
  backgroundStyle: GlobeBackground,
): backgroundStyle is "satellite" | "shaded-relief" {
  return backgroundStyle in RASTER_URLS;
}

export function loadSourceRaster(backgroundStyle: GlobeBackground): Promise<SourceRaster> {
  const existing = sourcePromises.get(backgroundStyle);
  if (existing) return existing;

  const url = RASTER_URLS[backgroundStyle];
  if (!url) {
    return Promise.reject(
      new Error(`Background style ${backgroundStyle} does not use a raster asset.`),
    );
  }

  const sourcePromise = loadImage(url).then((image) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas 2D is unavailable.");
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return {
      width: canvas.width,
      height: canvas.height,
      pixels: imageData.data,
    };
  });
  sourcePromises.set(backgroundStyle, sourcePromise);
  return sourcePromise;
}

function isInProjection(
  longitude: number,
  latitude: number,
  projection: AppConfig["projection"],
): boolean {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (projection.name === "orthographic") {
    return (
      geoDistance(
        [projection.centerLongitude, projection.centerLatitude],
        [longitude, latitude],
      ) <=
      Math.PI / 2 + 1e-6
    );
  }
  return longitude >= -180.0001 && longitude <= 180.0001;
}

export async function renderProjectedRaster({
  projection: projectionConfig,
  logicalWidth,
  logicalHeight,
  outputWidth,
  outputHeight,
  backgroundStyle,
  shouldCancel = () => false,
  yieldDuringRender = false,
}: RasterRenderOptions): Promise<HTMLCanvasElement> {
  const source = await loadSourceRaster(backgroundStyle);
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(outputWidth));
  output.height = Math.max(1, Math.round(outputHeight));
  const context = output.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");

  const destination = context.createImageData(output.width, output.height);
  const destinationPixels = destination.data;
  const projection = createProjection(projectionConfig, logicalWidth, logicalHeight);
  const xScale = logicalWidth / output.width;
  const yScale = logicalHeight / output.height;

  for (let y = 0; y < output.height; y += 1) {
    if (shouldCancel()) return output;
    const logicalY = (y + 0.5) * yScale;

    for (let x = 0; x < output.width; x += 1) {
      const logicalX = (x + 0.5) * xScale;
      const coordinate = projection.invert?.([logicalX, logicalY]);
      if (!coordinate || !isInProjection(coordinate[0], coordinate[1], projectionConfig)) {
        continue;
      }

      const longitude = ((coordinate[0] + 180) % 360 + 360) % 360;
      const sourceX = Math.min(
        source.width - 1,
        Math.max(0, Math.round((longitude / 360) * (source.width - 1))),
      );
      const sourceY = Math.min(
        source.height - 1,
        Math.max(0, Math.round(((90 - coordinate[1]) / 180) * (source.height - 1))),
      );
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      const destinationIndex = (y * output.width + x) * 4;
      destinationPixels[destinationIndex] = source.pixels[sourceIndex];
      destinationPixels[destinationIndex + 1] = source.pixels[sourceIndex + 1];
      destinationPixels[destinationIndex + 2] = source.pixels[sourceIndex + 2];
      destinationPixels[destinationIndex + 3] = 255;
    }

    if (yieldDuringRender && y > 0 && y % 80 === 0) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  if (!shouldCancel()) {
    context.putImageData(destination, 0, 0);
    context.save();
    context.globalCompositeOperation = "destination-in";
    context.scale(output.width / logicalWidth, output.height / logicalHeight);
    context.beginPath();
    geoPath(projection, context)(SPHERE);
    context.fill();
    context.restore();
  }
  return output;
}
