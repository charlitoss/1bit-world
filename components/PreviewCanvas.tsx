"use client";

import { useEffect, useRef, useState } from "react";
import { paintResult, type RenderOutput } from "@/lib/image/engine";
import { Icon } from "./ui/Icon";

export function PreviewCanvas({
  output,
  busy,
  sourceUrl,
}: {
  output: RenderOutput | null;
  busy: boolean;
  sourceUrl: string | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    if (output && ref.current) paintResult(ref.current, output);
  }, [output]);

  return (
    <div className="panel relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
      {/* Dithered result */}
      <canvas
        ref={ref}
        className="pixelated max-h-full max-w-full object-contain"
        style={{ display: output ? "block" : "none" }}
      />

      {/* Hold-to-compare original */}
      {compare && sourceUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sourceUrl}
          alt="original"
          className="absolute inset-3 m-auto max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] object-contain"
        />
      )}

      {/* Top-left readout */}
      {output && (
        <div className="absolute left-2 top-2 panel px-2 py-1 font-display text-[11px] uppercase tracking-wider">
          {output.outWidth}×{output.outHeight}
        </div>
      )}

      {/* Compare button */}
      {output && sourceUrl && (
        <button
          className="btn absolute right-2 top-2 px-2 py-1 text-[11px] font-display uppercase tracking-wider"
          onPointerDown={() => setCompare(true)}
          onPointerUp={() => setCompare(false)}
          onPointerLeave={() => setCompare(false)}
          title="Hold to see the original"
        >
          <Icon name="image" size={16} />
          {compare ? "original" : "compare"}
        </button>
      )}

      {busy && (
        <div className="absolute bottom-2 right-2 panel px-2 py-1 font-display text-[11px] uppercase tracking-wider">
          working…
        </div>
      )}
    </div>
  );
}
