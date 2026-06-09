// Web Worker: runs the pure dithering kernel off the main thread.
import { processImage } from "../dither/process";
import type { ProcessParams } from "../dither/types";

interface Req {
  id: number;
  buffer: ArrayBuffer;
  width: number;
  height: number;
  params: ProcessParams;
}

self.onmessage = (e: MessageEvent) => {
  const { id, buffer, width, height, params } = e.data as Req;
  const src = new ImageData(new Uint8ClampedArray(buffer), width, height);
  const out = processImage(src, params);
  (self as unknown as Worker).postMessage(
    { id, buffer: out.mask.buffer, width: out.width, height: out.height },
    [out.mask.buffer],
  );
};
