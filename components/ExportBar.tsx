"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/store";
import { renderToBlob } from "@/lib/image/engine";
import {
  downloadBlob,
  copyImageToClipboard,
  canCopyImage,
  shareImage,
  canShareFiles,
} from "@/lib/export/share";
import { Button } from "./ui/Button";

export function ExportBar({
  bitmap,
  baseName,
}: {
  bitmap: ImageBitmap;
  baseName: string;
}) {
  const { settings } = useSettings();
  const [busy, setBusy] = useState<null | string>(null);
  const [copied, setCopied] = useState(false);
  const [shareable, setShareable] = useState(false);
  const filename = `${baseName}-1bit.png`;

  // Probe Web Share support for files once.
  useEffect(() => {
    let cancelled = false;
    renderToBlob(bitmap, settings)
      .then((b) => !cancelled && setShareable(canShareFiles(b, filename)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bitmap]);

  async function run(kind: "download" | "copy" | "share") {
    setBusy(kind);
    try {
      const blob = await renderToBlob(bitmap, settings);
      if (kind === "download") downloadBlob(blob, filename);
      else if (kind === "copy") {
        await copyImageToClipboard(blob);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } else {
        if (canShareFiles(blob, filename)) await shareImage(blob, filename);
        else downloadBlob(blob, filename);
      }
    } catch (e) {
      // Swallow user-cancelled share; surface anything else to the console.
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        console.error(e);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        icon="download"
        onClick={() => run("download")}
        disabled={busy !== null}
        title="Download PNG"
      >
        <span className="hidden sm:inline">
          {busy === "download" ? "…" : "Download"}
        </span>
      </Button>
      <Button
        icon={copied ? "check" : "copy"}
        onClick={() => run("copy")}
        disabled={busy !== null || !canCopyImage()}
        title={canCopyImage() ? "Copy PNG to clipboard" : "Clipboard unsupported"}
      >
        <span className="hidden sm:inline">
          {copied ? "Copied" : busy === "copy" ? "…" : "Copy"}
        </span>
      </Button>
      {shareable && (
        <Button
          icon="share"
          onClick={() => run("share")}
          disabled={busy !== null}
          title="Share"
        >
          <span className="hidden sm:inline">
            {busy === "share" ? "…" : "Share"}
          </span>
        </Button>
      )}
    </div>
  );
}
