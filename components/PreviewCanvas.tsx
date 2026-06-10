"use client";

import { useEffect, useRef, useState } from "react";
import { paintResult, type RenderOutput } from "@/lib/image/engine";
import { ExportBar } from "./ExportBar";

export function PreviewCanvas({
  output,
  busy,
  sourceUrl,
  bitmap,
  baseName,
}: {
  output: RenderOutput | null;
  busy: boolean;
  sourceUrl: string | null;
  bitmap: ImageBitmap;
  baseName: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    if (output && ref.current) paintResult(ref.current, output);
  }, [output]);

  // Reset the comparison whenever a different source image loads.
  useEffect(() => {
    setCompare(false);
  }, [sourceUrl]);

  const canCompare = !!output && !!sourceUrl;

  return (
    <div className="panel relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
      {/* Dithered result — click/tap to toggle the original. */}
      <canvas
        ref={ref}
        onClick={() => canCompare && setCompare((c) => !c)}
        className={`pixelated max-h-full max-w-full object-contain ${
          canCompare ? "cursor-pointer" : ""
        }`}
        style={{ display: output ? "block" : "none" }}
      />

      {/* Original overlay (clicks pass through to the canvas to toggle back). */}
      {compare && sourceUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sourceUrl}
          alt="original"
          className="pointer-events-none absolute inset-3 m-auto max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] object-contain"
        />
      )}

      {/* Dimensions, top-left. */}
      {output && (
        <div className="panel absolute left-2 top-2 px-2 py-1 font-display text-[10px] uppercase">
          {output.outWidth}×{output.outHeight}
        </div>
      )}

      {/* Export actions, top-right of the image. */}
      <div className="absolute right-2 top-2">
        <ExportBar bitmap={bitmap} baseName={baseName} />
      </div>

      {/* Compare state / hint, bottom-left. */}
      {canCompare && (
        <div className="panel absolute bottom-2 left-2 px-2 py-1 font-display text-[9px] uppercase">
          {compare ? "Original" : "Tap to compare"}
        </div>
      )}

      {busy && (
        <div className="panel absolute bottom-2 right-2 px-2 py-1 font-display text-[9px] uppercase">
          working…
        </div>
      )}
    </div>
  );
}
