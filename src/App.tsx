import { useEffect, useRef, useState } from "react";
import { Controls } from "./components/Controls";
import { GlobeFigure } from "./components/GlobeFigure";
import { exportConfig, exportPng, exportSvg } from "./export/exportFigure";
import { createDefaultConfig, normalizeConfig } from "./state/config";
import {
  configFromLocation,
  saveLocalConfig,
  shareUrl,
} from "./state/share";
import type { AppConfig } from "./types";
import "./styles.css";

type Notice = { message: string; tone: "success" | "error" } | null;

function initialConfig(): AppConfig {
  return configFromLocation() ?? createDefaultConfig();
}

export default function App() {
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [notice, setNotice] = useState<Notice>(null);
  const [exporting, setExporting] = useState<"png" | "svg" | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => saveLocalConfig(config), 250);
    return () => window.clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const runExport = async (format: "png" | "svg") => {
    const svg = svgRef.current;
    if (!svg) return;
    setExporting(format);
    try {
      if (format === "png") await exportPng(svg, config);
      else await exportSvg(svg, config);
      setNotice({ message: `${format.toUpperCase()} export created`, tone: "success" });
    } catch (error) {
      setNotice({
        message: error instanceof Error ? error.message : "Export failed",
        tone: "error",
      });
    } finally {
      setExporting(null);
    }
  };

  const copyLink = async () => {
    const url = shareUrl(config);
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setNotice({ message: "Share link copied", tone: "success" });
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.append(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      textArea.remove();
      setNotice({
        message: copied ? "Share link copied" : "Share link added to the address bar",
        tone: copied ? "success" : "error",
      });
    }
  };

  const importProject = async (file: File | undefined) => {
    if (!file) return;
    try {
      setConfig(normalizeConfig(JSON.parse(await file.text())));
      setNotice({ message: "Project imported", tone: "success" });
    } catch {
      setNotice({ message: "That project file is not valid", tone: "error" });
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <i />
          </span>
          <span>
            <strong>GlobeFig</strong>
            <small>ngEHT telescope map builder</small>
          </span>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setConfig(createDefaultConfig())}
          >
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={copyLink}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.25 1.25m1.25 3.75a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.25-1.25" />
            </svg>
            Share
          </button>
          <div className="export-menu">
            <button
              type="button"
              className="primary-button"
              disabled={exporting !== null}
              onClick={() => void runExport("png")}
            >
              {exporting === "png" ? "Rendering…" : "Export PNG"}
            </button>
            <button
              type="button"
              className="primary-button icon-button"
              aria-label="Export SVG"
              title="Export editable SVG"
              disabled={exporting !== null}
              onClick={() => void runExport("svg")}
            >
              SVG
            </button>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="canvas-column" aria-label="Figure preview">
          <div className="canvas-heading">
            <div>
              <span className="eyebrow">Live preview</span>
              <h1>Telescope array globe</h1>
            </div>
            <div className="project-actions">
              <button type="button" className="text-button" onClick={() => exportConfig(config)}>
                Save project
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => importRef.current?.click()}
              >
                Open project
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(event) => {
                  void importProject(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
          </div>
          <div className="canvas-card checkerboard">
            <GlobeFigure ref={svgRef} config={config} setConfig={setConfig} />
          </div>
          <div className="canvas-help">
            <span>
              <kbd>Tip</kbd> Drag labels directly on the figure. Click a telescope to highlight
              its baselines.
            </span>
            <span>Exports use the exact pixel dimensions set in Globe &amp; canvas.</span>
          </div>
        </section>
        <Controls config={config} setConfig={setConfig} />
      </main>

      {notice && (
        <div className={`toast ${notice.tone}`} role="status">
          {notice.message}
        </div>
      )}
    </div>
  );
}
