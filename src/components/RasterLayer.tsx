import { useEffect, useRef } from "react";
import { renderProjectedRaster } from "../render/raster";
import type { AppConfig } from "../types";

interface RasterLayerProps {
  config: AppConfig;
  onRenderingChange: (rendering: boolean) => void;
}

export function RasterLayer({ config, onRenderingChange }: RasterLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderId = renderIdRef.current + 1;
    renderIdRef.current = renderId;
    const previewWidth = Math.min(1280, config.figure.width);
    const previewHeight = Math.max(
      1,
      Math.round(previewWidth * (config.figure.height / config.figure.width)),
    );
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);

    if (!config.map.showRaster) {
      onRenderingChange(false);
      return;
    }

    const timer = window.setTimeout(() => {
      onRenderingChange(true);
      void renderProjectedRaster({
        projection: config.projection,
        logicalWidth: config.figure.width,
        logicalHeight: config.figure.height,
        outputWidth: previewWidth,
        outputHeight: previewHeight,
        shouldCancel: () => renderIdRef.current !== renderId,
        yieldDuringRender: true,
      })
        .then((projected) => {
          if (renderIdRef.current !== renderId) return;
          const target = canvas.getContext("2d");
          target?.clearRect(0, 0, canvas.width, canvas.height);
          target?.drawImage(projected, 0, 0, canvas.width, canvas.height);
        })
        .finally(() => {
          if (renderIdRef.current === renderId) onRenderingChange(false);
        });
    }, 40);

    return () => {
      window.clearTimeout(timer);
      if (renderIdRef.current === renderId) renderIdRef.current += 1;
    };
  }, [
    config.figure.height,
    config.figure.width,
    config.map.showRaster,
    config.projection.centerLatitude,
    config.projection.centerLongitude,
    config.projection.name,
    onRenderingChange,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="figure-raster"
      style={{ opacity: config.map.rasterOpacity }}
      aria-hidden="true"
    />
  );
}
