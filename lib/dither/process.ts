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

/** Rec.709 luminance with contrast + brightness pre-adjustment, into a Float32 buffer. */
function toGray(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  contrast: number,
  brightness: number,
): Float32Array {
  const gray = new Float32Array(w * h);
  // Contrast slider -100..100 → standard factor.
  const c = Math.max(-255, Math.min(255, contrast * 2.55));
  const cf = (259 * (c + 255)) / (255 * (259 - c));
  const bAdd = brightness * 1.28; // -100..100 → ~-128..128
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    let l = 0.2126 * src[p] + 0.7152 * src[p + 1] + 0.0722 * src[p + 2];
    l = cf * (l - 128) + 128 + bAdd;
    gray[i] = l < 0 ? 0 : l > 255 ? 255 : l;
  }
  return gray;
}

function runErrorDiffusion(
  gray: Float32Array,
  w: number,
  h: number,
  threshold: number,
  kernel: DiffusionKernel,
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
      const err = old - nv;
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
): void {
  const { data, size } = matrix;
  const bias = 128 - threshold; // threshold slider shifts overall darkness
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const m = data[(y % size) * size + (x % size)] * 255;
      gray[i] = gray[i] + bias > m ? 255 : 0;
    }
  }
}

function runThreshold(gray: Float32Array, threshold: number): void {
  for (let i = 0; i < gray.length; i++) gray[i] = gray[i] < threshold ? 0 : 255;
}

/** Run the full pipeline and return a freshly allocated ImageData (working res). */
export function processImage(src: ImageData, p: ProcessParams): ImageData {
  const { width: w, height: h } = src;
  const gray = toGray(src.data, w, h, p.contrast, p.brightness);

  switch (p.algorithm) {
    case "threshold":
      runThreshold(gray, p.threshold);
      break;
    case "bayer4":
      runOrdered(gray, w, h, p.threshold, BAYER_4);
      break;
    case "bayer8":
      runOrdered(gray, w, h, p.threshold, BAYER_8);
      break;
    default:
      runErrorDiffusion(gray, w, h, p.threshold, KERNELS[p.algorithm]);
  }

  // Map 1-bit result → two-tone palette.
  const [d0, d1, d2] = p.invert ? p.light : p.dark;
  const [l0, l1, l2] = p.invert ? p.dark : p.light;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0, o = 0; i < gray.length; i++, o += 4) {
    const lit = gray[i] >= 128;
    out[o] = lit ? l0 : d0;
    out[o + 1] = lit ? l1 : d1;
    out[o + 2] = lit ? l2 : d2;
    out[o + 3] = 255;
  }
  return new ImageData(out, w, h);
}
