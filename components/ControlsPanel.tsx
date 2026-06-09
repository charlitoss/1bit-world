"use client";

import type { ReactNode } from "react";
import { useSettings } from "@/lib/store";
import { ALGORITHMS } from "@/lib/dither/types";
import { PALETTES } from "@/lib/dither/palettes";
import { Slider } from "./ui/Slider";
import { Icon } from "./ui/Icon";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xs uppercase tracking-widest text-ink-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ControlsPanel() {
  const { settings, update, reset } = useSettings();

  return (
    <div className="panel flex flex-col gap-5 overflow-y-auto p-4">
      <Section title="Algorithm">
        <div className="grid grid-cols-2 gap-2">
          {ALGORITHMS.map((a) => (
            <button
              key={a.id}
              onClick={() => update("algorithm", a.id)}
              className={`btn px-2 py-2 text-[12px] font-display uppercase tracking-wide ${
                settings.algorithm === a.id ? "btn-on" : ""
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Palette">
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
                <span className="font-display text-[11px] uppercase tracking-wide">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Adjust">
        <div className="space-y-4">
          <Slider
            label="Pixel size"
            value={settings.scale}
            min={1}
            max={12}
            onChange={(v) => update("scale", v)}
            format={(v) => `${v}×`}
          />
          <Slider
            label="Threshold"
            value={settings.threshold}
            min={1}
            max={254}
            onChange={(v) => update("threshold", v)}
          />
          <Slider
            label="Contrast"
            value={settings.contrast}
            min={-100}
            max={100}
            onChange={(v) => update("contrast", v)}
          />
          <Slider
            label="Brightness"
            value={settings.brightness}
            min={-100}
            max={100}
            onChange={(v) => update("brightness", v)}
          />
        </div>
      </Section>

      <div className="flex items-center justify-between">
        <button
          onClick={() => update("invert", !settings.invert)}
          className={`btn px-3 py-2 text-sm font-display uppercase tracking-wider ${
            settings.invert ? "btn-on" : ""
          }`}
        >
          <Icon name="invert" size={18} />
          Invert
        </button>
        <button
          onClick={reset}
          className="btn px-3 py-2 text-sm font-display uppercase tracking-wider"
        >
          <Icon name="reset" size={18} />
          Reset
        </button>
      </div>
    </div>
  );
}
