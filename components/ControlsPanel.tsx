"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSettings } from "@/lib/store";
import { ALGORITHMS, CUSTOM_PALETTE_ID, type PatternId } from "@/lib/dither/types";
import { PALETTES } from "@/lib/dither/palettes";
import { PATTERNS, buildStamp } from "@/lib/dither/patterns";
import { Slider } from "./ui/Slider";
import { Icon } from "./ui/Icon";

function Group({
  title,
  children,
  first,
}: {
  title: string;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <section
      className={
        first ? "space-y-3" : "space-y-3 border-t-2 border-ink/15 pt-4"
      }
    >
      <h3 className="font-display text-[11px] uppercase tracking-wide text-ink-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Tiled preview of a pattern motif at full ink density. */
function PatternSwatch({ pattern }: { pattern: PatternId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cell = 6;
    const cells = 4;
    const size = cell * cells;
    cv.width = size;
    cv.height = size;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#e8e0cb"; // paper
    ctx.fillRect(0, 0, size, size);
    const stamp = buildStamp(pattern, cell);
    ctx.fillStyle = "#1e1a17"; // ink
    for (let cy = 0; cy < cells; cy++) {
      for (let cx = 0; cx < cells; cx++) {
        for (let y = 0; y < cell; y++) {
          for (let x = 0; x < cell; x++) {
            if (stamp[y * cell + x]) ctx.fillRect(cx * cell + x, cy * cell + y, 1, 1);
          }
        }
      }
    }
  }, [pattern]);
  return <canvas ref={ref} className="pixelated h-9 w-9" />;
}

export function ControlsPanel() {
  const { settings, update, reset, undo, redo, past, future } = useSettings();
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const isCustom = settings.paletteId === CUSTOM_PALETTE_ID;

  const setCustomColor = (key: "customDark" | "customLight", v: string) => {
    update(key, v);
    update("paletteId", CUSTOM_PALETTE_ID);
  };

  return (
    <div className="panel flex min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b-2 border-ink/15 px-3 py-2.5">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (⌘Z / Ctrl+Z)"
          aria-label="Undo"
          className="btn px-2 py-1.5"
        >
          <Icon name="undo" size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (⌘⇧Z / Ctrl+Y)"
          aria-label="Redo"
          className="btn px-2 py-1.5"
        >
          <Icon name="redo" size={16} />
        </button>
        <span className="ml-auto font-display text-[9px] uppercase tracking-wide text-ink-2">
          Undo · Redo
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <Group title="Dither" first>
        <div className="grid grid-cols-2 gap-2">
          {ALGORITHMS.map((a) => (
            <button
              key={a.id}
              onClick={() => update("algorithm", a.id)}
              className={`btn px-2 py-2 text-[9px] font-display uppercase leading-relaxed ${
                settings.algorithm === a.id ? "btn-on" : ""
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
        <Slider
          label="Dither amount"
          value={settings.ditherAmount}
          min={0}
          max={100}
          onChange={(v) => update("ditherAmount", v)}
          format={(v) => `${v}%`}
        />
        <Slider
          label="Threshold"
          value={settings.threshold}
          min={1}
          max={254}
          onChange={(v) => update("threshold", v)}
        />
      </Group>

      <Group title="Cell style">
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => {
            const on = settings.pattern === p.id;
            return (
              <button
                key={p.id}
                onClick={() => update("pattern", p.id)}
                title={p.name}
                className={`flex flex-col items-center gap-1 border-2 border-ink p-1.5 ${
                  on ? "bg-ink text-paper" : "bg-paper"
                }`}
              >
                <span className="border-2 border-ink">
                  <PatternSwatch pattern={p.id} />
                </span>
                <span className="font-display text-[8px] uppercase">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
        <Slider
          label="Pixel size"
          value={settings.scale}
          min={1}
          max={12}
          onChange={(v) => update("scale", v)}
          format={(v) => `${v}×`}
        />
        {settings.scale < 3 && settings.pattern !== "square" && (
          <p className="text-[11px] text-ink-2">
            Tip: raise pixel size to see the pattern.
          </p>
        )}
      </Group>

      <Group title="Palette">
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((p) => {
            const on = settings.paletteId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => update("paletteId", p.id)}
                title={p.name}
                className={`flex items-center gap-2 border-2 border-ink px-2 py-1 ${
                  on ? "bg-ink text-paper" : "bg-paper"
                }`}
              >
                <span
                  className="inline-block h-4 w-7 border border-ink"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${p.dark} 0 50%, ${p.light} 50% 100%)`,
                  }}
                />
                <span className="font-display text-[9px] uppercase">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={`flex items-center gap-2 border-2 border-ink px-2 py-1.5 ${
            isCustom ? "bg-ink/10" : ""
          }`}
        >
          <button
            onClick={() => update("paletteId", CUSTOM_PALETTE_ID)}
            className="flex items-center gap-1 font-display text-[9px] uppercase"
          >
            {isCustom && <Icon name="check" size={14} />}
            Custom
          </button>
          <div className="ml-auto flex items-center gap-3">
            <ColorSwatch
              label="Dark"
              value={settings.customDark}
              onChange={(v) => setCustomColor("customDark", v)}
            />
            <ColorSwatch
              label="Light"
              value={settings.customLight}
              onChange={(v) => setCustomColor("customLight", v)}
            />
          </div>
        </div>

        <button
          onClick={() => update("invert", !settings.invert)}
          className={`btn w-full px-3 py-2 text-[10px] font-display uppercase ${
            settings.invert ? "btn-on" : ""
          }`}
        >
          <Icon name="invert" size={18} />
          Invert
        </button>
      </Group>

      <Group title="Adjust">
        <Slider
          label="Brightness"
          value={settings.brightness}
          min={-100}
          max={100}
          onChange={(v) => update("brightness", v)}
        />
        <Slider
          label="Contrast"
          value={settings.contrast}
          min={-100}
          max={100}
          onChange={(v) => update("contrast", v)}
        />
        <Slider
          label="Gamma"
          value={settings.gamma}
          min={0.2}
          max={3}
          step={0.05}
          onChange={(v) => update("gamma", v)}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="Sharpen ↔ Soften"
          value={settings.sharpen}
          min={-100}
          max={100}
          onChange={(v) => update("sharpen", v)}
        />
        <Slider
          label="Grain"
          value={settings.grain}
          min={0}
          max={100}
          onChange={(v) => update("grain", v)}
        />
      </Group>

      <button
        onClick={reset}
        className="btn justify-center px-3 py-2 text-[10px] font-display uppercase"
      >
        <Icon name="reset" size={18} />
        Reset all
      </button>
      </div>
    </div>
  );
}

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-ink-2">
        {label}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-9 cursor-pointer border-2 border-ink bg-paper p-0"
      />
    </label>
  );
}
