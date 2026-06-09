// Pure, DOM-free dithering kernel. Safe to run on the main thread or in a worker.
// Input/Output are ImageData at the *working* resolution (pixel-scale is applied
// by the caller via canvas down/up-sampling).

import { BAYER_4, BAYER_8 } from "./bayer";
import type { ProcessParams } from "./types";

interface DiffusionKernel {
  divisor: number;
  // [dx, dy, weight]
  taps: ReadonlyArray<readonly [number, number, number]>;
}

const KERNELS: Record<string, DiffusionKernel> = {
  "floyd-steinberg": {
    divisor: 16,
    taps: [
      [1, 0, 7],
      [-1, 1, 3],
      [0, 1, 5],
      [1, 1, 1],
    ],
  },
  atkinson: {
    // Divides by 8 but only distributes 6/8 of the error — the signature
    // high-contrast classic-Mac / Playdate look.
    divisor: 8,
    taps: [
      [1, 0, 1],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 2, 1],
    ],
  },
  burkes: {
    divisor: 32,
    taps: [
      [1, 0, 8],
      [2, 0, 4],
      [-2, 1, 2],
      [-1, 1, 4],
      [0, 1, 8],
      [1, 1, 4],
      [2, 1, 2],
    ],
  },
  "sierra-lite": {
    divisor: 4,
    taps: [
      [1, 0, 2],
      [-1, 1, 1],
      [0, 1, 1],
    ],
  },
};

/** Rec.709 luminance with contrast, brightness and gamma, into a Float32 buffer. */
function toGray(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  contrast: number,
  brightness: number,
  gamma: number,
): Float32Array {
  const gray = new Float32Array(w * h);
  // Contrast slider -100..100 → standard factor.
  const c = Math.max(-255, Math.min(255, contrast * 2.55));
  const cf = (259 * (c + 255)) / (255 * (259 - c));
  const bAdd = brightness * 1.28; // -100..100 → ~-128..128
  const invGamma = 1 / Math.max(0.01, gamma);
  const applyGamma = gamma !== 1;
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    let l = 0.2126 * src[p] + 0.7152 * src[p + 1] + 0.0722 * src[p + 2];
    l = cf * (l - 128) + 128 + bAdd;
    if (l < 0) l = 0;
    else if (l > 255) l = 255;
    if (applyGamma) l = 255 * Math.pow(l / 255, invGamma);
    gray[i] = l;
  }
  return gray;
}

/** Unsharp mask (+) / box-blur soften (−) over the grayscale buffer. amount: -100..100. */
function applySharpen(
  gray: Float32Array,
  w: number,
  h: number,
  amount: number,
): void {
  if (!amount) return;
  const blur = new Float32Array(gray.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let cnt = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          sum += gray[ny * w + nx];
          cnt++;
        }
      }
      blur[y * w + x] = sum / cnt;
    }
  }
  const k = amount / 100;
  if (k > 0) {
    const s = k * 2; // sharpen strength
    for (let i = 0; i < gray.length; i++) {
      const v = gray[i] + s * (gray[i] - blur[i]);
      gray[i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  } else {
    const t = -k;
    for (let i = 0; i < gray.length; i++) {
      gray[i] = gray[i] * (1 - t) + blur[i] * t;
    }
  }
}

/** Deterministic per-pixel grain (stable across re-renders). amount: 0..100. */
function applyGrain(
  gray: Float32Array,
  w: number,
  h: number,
  amount: number,
): void {
  if (!amount) return;
  const amp = (amount / 100) * 70;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const n = s - Math.floor(s); // 0..1
      const i = y * w + x;
      const v = gray[i] + (n - 0.5) * 2 * amp;
      gray[i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
}

function runErrorDiffusion(
  gray: Float32Array,
  w: number,
  h: number,
  threshold: number,
  kernel: DiffusionKernel,
  strength: number,
): void {
  const { divisor, taps } = kernel;
  for (let y = 0; y < h; y++) {
    const serp = (y & 1) === 1; // serpentine scan reduces directional artifacts
    const xStart = serp ? w - 1 : 0;
    const xEnd = serp ? -1 : w;
    const step = serp ? -1 : 1;
    for (let x = xStart; x !== xEnd; x += step) {
      const i = y * w + x;
      const old = gray[i];
      const nv = old < threshold ? 0 : 255;
      const err = (old - nv) * strength;
      gray[i] = nv;
      for (const [dx, dy, wt] of taps) {
        const sx = x + (serp ? -dx : dx);
        const sy = y + dy;
        if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
        gray[sy * w + sx] += (err * wt) / divisor;
      }
    }
  }
}

function runOrdered(
  gray: Float32Array,
  w: number,
  h: number,
  threshold: number,
  matrix: { data: Float32Array; size: number },
  strength: number,
): void {
  const { data, size } = matrix;
  const bias = 128 - threshold; // threshold slider shifts overall darkness
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const m = data[(y % size) * size + (x % size)] * 255;
      // Strength scales the matrix deviation around mid (0 → hard threshold).
      const mEff = 127.5 + (m - 127.5) * strength;
      gray[i] = gray[i] + bias > mEff ? 255 : 0;
    }
  }
}

function runThreshold(gray: Float32Array, threshold: number): void {
  for (let i = 0; i < gray.length; i++) gray[i] = gray[i] < threshold ? 0 : 255;
}

export interface DitherResult {
  /** 1 = ink (shadow) cell, 0 = paper. Working resolution. */
  mask: Uint8Array;
  width: number;
  height: number;
}

/** Run the tone→1-bit pipeline and return a binary mask (colours/pattern come later). */
export function processImage(src: ImageData, p: ProcessParams): DitherResult {
  const { width: w, height: h } = src;
  const gray = toGray(src.data, w, h, p.contrast, p.brightness, p.gamma);
  applySharpen(gray, w, h, p.sharpen);
  applyGrain(gray, w, h, p.grain);
  const strength = p.ditherAmount / 100;

  switch (p.algorithm) {
    case "threshold":
      runThreshold(gray, p.threshold);
      break;
    case "bayer4":
      runOrdered(gray, w, h, p.threshold, BAYER_4, strength);
      break;
    case "bayer8":
      runOrdered(gray, w, h, p.threshold, BAYER_8, strength);
      break;
    default:
      runErrorDiffusion(gray, w, h, p.threshold, KERNELS[p.algorithm], strength);
  }

  const mask = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) mask[i] = gray[i] < 128 ? 1 : 0;
  return { mask, width: w, height: h };
}
