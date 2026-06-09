// Shared types for the dithering engine.

export type AlgorithmId =
  | "threshold"
  | "floyd-steinberg"
  | "atkinson"
  | "burkes"
  | "sierra-lite"
  | "bayer4"
  | "bayer8";

export interface AlgorithmDef {
  id: AlgorithmId;
  name: string;
  kind: "threshold" | "error-diffusion" | "ordered";
}

export const ALGORITHMS: AlgorithmDef[] = [
  { id: "atkinson", name: "Atkinson", kind: "error-diffusion" },
  { id: "floyd-steinberg", name: "Floyd–Steinberg", kind: "error-diffusion" },
  { id: "burkes", name: "Burkes", kind: "error-diffusion" },
  { id: "sierra-lite", name: "Sierra Lite", kind: "error-diffusion" },
  { id: "bayer4", name: "Ordered 4×4", kind: "ordered" },
  { id: "bayer8", name: "Ordered 8×8", kind: "ordered" },
  { id: "threshold", name: "Threshold", kind: "threshold" },
];

export type RGB = [number, number, number];

/** Sentinel palette id for user-picked colors. */
export const CUSTOM_PALETTE_ID = "custom";

/** User-facing settings, persisted in the store. */
export interface DitherSettings {
  algorithm: AlgorithmId;
  paletteId: string;
  /** Used when paletteId === CUSTOM_PALETTE_ID. */
  customDark: string;
  customLight: string;
  /** 0..255 — midpoint cutoff / bias. */
  threshold: number;
  /** -100..100. */
  contrast: number;
  /** -100..100. */
  brightness: number;
  /** 0.2..3.0 — midtone curve (1 = none). */
  gamma: number;
  /** -100..100 — soften (−) ↔ sharpen (+). */
  sharpen: number;
  /** 0..100 — film-grain noise. */
  grain: number;
  /** 0..100 — dither strength (0 = hard threshold, 100 = full). */
  ditherAmount: number;
  /** 1..12 — pixel block size (chunkiness). */
  scale: number;
  invert: boolean;
}

/** Resolved parameters passed into the pure pixel kernel (DOM-free, worker-safe). */
export interface ProcessParams {
  algorithm: AlgorithmId;
  threshold: number;
  contrast: number;
  brightness: number;
  gamma: number;
  sharpen: number;
  grain: number;
  ditherAmount: number;
  invert: boolean;
  dark: RGB;
  light: RGB;
}

export const DEFAULT_SETTINGS: DitherSettings = {
  algorithm: "atkinson",
  paletteId: "parchment",
  customDark: "#1e1a17",
  customLight: "#e8e0cb",
  threshold: 128,
  contrast: 10,
  brightness: 0,
  gamma: 1,
  sharpen: 0,
  grain: 0,
  ditherAmount: 100,
  scale: 2,
  invert: false,
};
