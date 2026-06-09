// Client-side rendering engine: decode → downsample → dither (worker, with a
// main-thread fallback) → return palette-mapped working-res ImageData + output dims.
// Painting and export are separate so the React layer can guard against stale renders.

import { processImage } from "../dither/process";
import { getPalette, hexToRgb } from "../dither/palettes";
import type { DitherSettings, ProcessParams } from "../dither/types";

/** Longest-edge cap for the live preview so huge images stay responsive. */
const PREVIEW_MAX = 1600;

export interface RenderOutput {
  /** Working-resolution, palette-mapped pixels. */
  image: ImageData;
  /** Upscaled (chunky) output dimensions. */
  outWidth: number;
  outHeight: number;
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
  const pal = getPalette(s.paletteId);
  return {
    algorithm: s.algorithm,
    threshold: s.threshold,
    contrast: s.contrast,
    brightness: s.brightness,
    invert: s.invert,
    dark: hexToRgb(pal.dark),
    light: hexToRgb(pal.light),
  };
}

class DitherEngine {
  private worker: Worker | null = null;
  private reqId = 0;
  private pending = new Map<number, (img: ImageData) => void>();

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
          cb(new ImageData(new Uint8ClampedArray(buffer), width, height));
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

  private process(src: ImageData, params: ProcessParams): Promise<ImageData> {
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

    const image = await this.process(srcData, paramsFromSettings(settings));
    return { image, outWidth: workW * scale, outHeight: workH * scale };
  }
}

let _engine: DitherEngine | null = null;
export function getEngine(): DitherEngine {
  if (!_engine) _engine = new DitherEngine();
  return _engine;
}

/** Paint a render result onto a canvas with crisp, nearest-neighbor upscaling. */
export function paintResult(
  canvas: HTMLCanvasElement,
  out: RenderOutput,
): void {
  canvas.width = out.outWidth;
  canvas.height = out.outHeight;
  const ctx = canvas.getContext("2d")!;
  const small = createCanvas(out.image.width, out.image.height);
  small.getContext("2d")!.putImageData(out.image, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, out.outWidth, out.outHeight);
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
