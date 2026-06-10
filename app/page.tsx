"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@/lib/store";
import { getEngine, type RenderOutput } from "@/lib/image/engine";
import { Dropzone } from "@/components/Dropzone";
import { PreviewCanvas } from "@/components/PreviewCanvas";
import { ControlsPanel } from "@/components/ControlsPanel";
import { ExportBar } from "@/components/ExportBar";
import { FilePicker } from "@/components/ui/FilePicker";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { EarthLogo } from "@/components/ui/EarthLogo";
import { canReadClipboard, readImageFromClipboard } from "@/lib/export/share";

export default function Home() {
  const { settings } = useSettings();
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [baseName, setBaseName] = useState("image");
  const [output, setOutput] = useState<RenderOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const seqRef = useRef(0);

  const loadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const bmp = await getEngine().decode(file);
    setBitmap(bmp);
    setSourceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setBaseName(file.name.replace(/\.[^.]+$/, "") || "image");
    setOutput(null);
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    const file = await readImageFromClipboard();
    if (file) loadFile(file);
  }, [loadFile]);

  // Re-render whenever the image or any setting changes (debounced, latest-wins).
  useEffect(() => {
    if (!bitmap) return;
    const seq = ++seqRef.current;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const out = await getEngine().render(bitmap, settings);
        if (seqRef.current === seq) setOutput(out);
      } finally {
        if (seqRef.current === seq) setBusy(false);
      }
    }, 70);
    return () => clearTimeout(t);
  }, [bitmap, settings]);

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const f = item?.getAsFile();
      if (f) loadFile(f);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadFile]);

  // Clean up the object URL on unmount.
  useEffect(
    () => () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    },
    [sourceUrl],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-ink px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <EarthLogo className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" />
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="font-display text-[11px] uppercase sm:text-2xl">
              1bit<span className="text-ink-2">.world</span>
            </h1>
            <span className="hidden text-xs text-ink-2 lg:inline">
              dither anything · in your browser
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {bitmap && canReadClipboard() && (
            <button
              onClick={pasteFromClipboard}
              title="Paste image from clipboard"
              className="btn px-2 py-2 text-[11px] font-display uppercase sm:px-3"
            >
              <Icon name="paste" size={18} />
              <span className="hidden sm:inline">Paste</span>
            </button>
          )}
          {bitmap && (
            <FilePicker
              onFile={loadFile}
              className="btn cursor-pointer px-2 py-2 text-[11px] font-display uppercase sm:px-3"
            >
              <Icon name="image" size={18} />
              <span className="hidden sm:inline">New image</span>
            </FilePicker>
          )}
          <a
            href="https://github.com/charlitoss/1bit-world"
            target="_blank"
            rel="noreferrer"
            className="btn px-2 py-2"
            title="Source on GitHub"
          >
            <Icon name="github" size={18} />
          </a>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row">
        {!bitmap ? (
          <div className="flex flex-1 items-center justify-center">
            <Dropzone onFile={loadFile} />
          </div>
        ) : (
          <>
            <section className="flex min-h-0 flex-1 flex-col gap-3">
              <PreviewCanvas
                output={output}
                busy={busy}
                sourceUrl={sourceUrl}
              />
              <ExportBar bitmap={bitmap} baseName={baseName} />
            </section>
            <aside className="flex min-h-0 w-full flex-1 lg:w-96 lg:flex-none">
              <ControlsPanel />
            </aside>
          </>
        )}
      </main>

      <footer className="shrink-0 border-t-2 border-ink px-4 py-2 text-center text-[11px] text-ink-2">
        100% client-side — your images never leave this device. Video support
        coming next.
      </footer>
    </div>
  );
}
