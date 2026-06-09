import type { RGB } from "./types";

export interface PaletteDef {
  id: string;
  name: string;
  /** Hex for the "0" / shadow value. */
  dark: string;
  /** Hex for the "1" / highlight value. */
  light: string;
}

/** Two-tone presets. "Parchment" matches the reference cream + warm near-black. */
export const PALETTES: PaletteDef[] = [
  { id: "parchment", name: "Parchment", dark: "#1e1a17", light: "#e8e0cb" },
  { id: "mono", name: "Mono", dark: "#000000", light: "#ffffff" },
  { id: "ink", name: "Blueprint", dark: "#0b2c4d", light: "#d6e6f2" },
  { id: "amber", name: "Amber CRT", dark: "#1a1200", light: "#ffb000" },
  { id: "gameboy", name: "Game Boy", dark: "#0f380f", light: "#9bbc0f" },
  { id: "noir", name: "Noir", dark: "#101014", light: "#c9c6be" },
];

export function getPalette(id: string): PaletteDef {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
