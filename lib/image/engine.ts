// Client-side rendering engine: decode → downsample → dither (worker, with a
// main-thread fallback) → return a 1-bit mask. Painting composites the chosen
// pattern + palette, and is separate so the React layer can guard stale renders.

import { processImage, type DitherResult } from "../dither/process";
import { getPalette, hexToRgb } from "../dither/palettes";
import { buildStamp } from "../dither/patterns";
import {
  CUSTOM_PALETTE_ID,
  type DitherSettings,
  type ProcessParams,
  type PatternId,
  type RGB,
} from "../dither/types";

/** Longest-edge cap for the live preview so huge images stay responsive. */
const PREVIEW_MAX = 1600;

export interface RenderOutput {
  /** 1-bit mask at working resolution. */
  mask: Uint8Array;
  maskW: number;
  maskH: number;
  /** Cell size (pixel size). */
  scale: number;
  /** Final (upscaled) output dimensions. */
  outWidth: number;
  outHeight: number;
  ink: RGB;
  paper: RGB;
  pattern: PatternId;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function paramsFromSettings(s: DitherSettings): ProcessParams {
  return {
    algorithm: s.algorithm,
    threshold: s.threshold,
    contrast: s.contrast,
    brightness: s.brightness,
    gamma: s.gamma,
    sharpen: s.sharpen,
    grain: s.grain,
    ditherAmount: s.ditherAmount,
  };
}

function colorsFromSettings(s: DitherSettings): { ink: RGB; paper: RGB } {
  const isCustom = s.paletteId === CUSTOM_PALETTE_ID;
  const pal = getPalette(s.paletteId);
  const dark = hexToRgb(isCustom ? s.customDark : pal.dark);
  const light = hexToRgb(isCustom ? s.customLight : pal.light);
  return s.invert ? { ink: light, paper: dark } : { ink: dark, paper: light };
}

class DitherEngine {
  private worker: Worker | null = null;
  private reqId = 0;
  private pending = new Map<number, (r: DitherResult) => void>();

  private ensureWorker(): Worker | null {
    if (this.worker || typeof window === "undefined") return this.worker;
    try {
      this.worker = new Worker(
        new URL("../workers/dither.worker.ts", import.meta.url),
      );
      this.worker.onmessage = (e: MessageEvent) => {
        const { id, buffer, width, height } = e.data;
        const cb = this.pending.get(id);
        if (cb) {
          this.pending.delete(id);
          cb({ mask: new Uint8Array(buffer), width, height });
        }
      };
      this.worker.onerror = () => {
        // Fall back to main-thread processing for any subsequent renders.
        this.worker = null;
      };
    } catch {
      this.worker = null;
    }
    return this.worker;
  }

  private process(src: ImageData, params: ProcessParams): Promise<DitherResult> {
    const worker = this.ensureWorker();
    if (!worker) return Promise.resolve(processImage(src, params));
    return new Promise((resolve) => {
      const id = ++this.reqId;
      this.pending.set(id, resolve);
      const buf = src.data.buffer;
      worker.postMessage(
        { id, buffer: buf, width: src.width, height: src.height, params },
        [buf],
      );
    });
  }

  async decode(file: Blob): Promise<ImageBitmap> {
    return createImageBitmap(file);
  }

  async render(
    bitmap: ImageBitmap,
    settings: DitherSettings,
    opts: { fullRes?: boolean } = {},
  ): Promise<RenderOutput> {
    const scale = clamp(Math.round(settings.scale), 1, 12);
    let natW = bitmap.width;
    let natH = bitmap.height;

    if (!opts.fullRes) {
      const longest = Math.max(natW, natH);
      if (longest > PREVIEW_MAX) {
        const k = PREVIEW_MAX / longest;
        natW = Math.round(natW * k);
        natH = Math.round(natH * k);
      }
    }

    const workW = Math.max(1, Math.round(natW / scale));
    const workH = Math.max(1, Math.round(natH / scale));

    // Downsample source into the working buffer (smoothing on for clean luma).
    const tmp = createCanvas(workW, workH);
    const tctx = tmp.getContext("2d")!;
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(bitmap, 0, 0, workW, workH);
    const srcData = tctx.getImageData(0, 0, workW, workH);

    const result = await this.process(srcData, paramsFromSettings(settings));
    const { ink, paper } = colorsFromSettings(settings);
    return {
      mask: result.mask,
      maskW: result.width,
      maskH: result.height,
      scale,
      outWidth: result.width * scale,
      outHeight: result.height * scale,
      ink,
      paper,
      pattern: settings.pattern,
    };
  }
}

let _engine: DitherEngine | null = null;
export function getEngine(): DitherEngine {
  if (!_engine) _engine = new DitherEngine();
  return _engine;
}

/** Composite the mask into pixels: fill paper, stamp the pattern into ink cells. */
export function paintResult(
  canvas: HTMLCanvasElement,
  out: RenderOutput,
): void {
  const { mask, maskW, scale, outWidth, outHeight, ink, paper, pattern } = out;
  const stamp = buildStamp(pattern, scale);

  // Precompute per-column cell + sub-pixel index (avoids divides in the hot loop).
  const colCell = new Int32Array(outWidth);
  const colSub = new Int32Array(outWidth);
  for (let ox = 0; ox < outWidth; ox++) {
    colCell[ox] = (ox / scale) | 0;
    colSub[ox] = ox % scale;
  }

  const img = new ImageData(outWidth, outHeight);
  const d = img.data;
  let o = 0;
  for (let oy = 0; oy < outHeight; oy++) {
    const rowMask = ((oy / scale) | 0) * maskW;
    const rowStamp = (oy % scale) * scale;
    for (let ox = 0; ox < outWidth; ox++) {
      const isInk = mask[rowMask + colCell[ox]] && stamp[rowStamp + colSub[ox]];
      const c = isInk ? ink : paper;
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = 255;
      o += 4;
    }
  }

  canvas.width = outWidth;
  canvas.height = outHeight;
  canvas.getContext("2d")!.putImageData(img, 0, 0);
}

/** Render at full resolution and return a PNG blob for export. */
export async function renderToBlob(
  bitmap: ImageBitmap,
  settings: DitherSettings,
): Promise<Blob> {
  const out = await getEngine().render(bitmap, settings, { fullRes: true });
  const canvas = createCanvas(out.outWidth, out.outHeight);
  paintResult(canvas, out);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}
