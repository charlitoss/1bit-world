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

/** User-facing settings, persisted in the store. */
export interface DitherSettings {
  algorithm: AlgorithmId;
  paletteId: string;
  /** 0..255 — midpoint cutoff / bias. */
  threshold: number;
  /** -100..100. */
  contrast: number;
  /** -100..100. */
  brightness: number;
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
  invert: boolean;
  dark: RGB;
  light: RGB;
}

export const DEFAULT_SETTINGS: DitherSettings = {
  algorithm: "atkinson",
  paletteId: "parchment",
  threshold: 128,
  contrast: 10,
  brightness: 0,
  scale: 2,
  invert: false,
};
