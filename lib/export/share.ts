// Local-only sharing helpers — everything stays in the browser.

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function canCopyImage(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof window !== "undefined" &&
    typeof window.ClipboardItem !== "undefined"
  );
}

export async function copyImageToClipboard(blob: Blob): Promise<void> {
  // Clipboard only reliably accepts PNG.
  const item = new ClipboardItem({ [blob.type || "image/png"]: blob });
  await navigator.clipboard.write([item]);
}

export function canReadClipboard(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.read === "function"
  );
}

/** Read an image off the clipboard via the async Clipboard API (needs a user gesture). */
export async function readImageFromClipboard(): Promise<File | null> {
  if (!canReadClipboard()) return null;
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = item.types.find((t) => t.startsWith("image/"));
      if (type) {
        const blob = await item.getType(type);
        const ext = type.split("/")[1]?.split("+")[0] || "png";
        return new File([blob], `pasted.${ext}`, { type });
      }
    }
  } catch {
    // Permission denied, no gesture, or unsupported — caller handles the null.
  }
  return null;
}

export function canShareFiles(blob: Blob, filename: string): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    const file = new File([blob], filename, { type: blob.type });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export async function shareImage(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type });
  await navigator.share({
    files: [file],
    title: "1bit.world",
    text: "Dithered with 1bit.world",
  });
}
