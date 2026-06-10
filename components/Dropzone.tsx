"use client";

import { useEffect, useState } from "react";
import { Icon } from "./ui/Icon";
import { FilePicker } from "./ui/FilePicker";
import { canReadClipboard, readImageFromClipboard } from "@/lib/export/share";

export function Dropzone({ onFile }: { onFile: (file: File) => void }) {
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Avoid SSR/client mismatch: clipboard support is only known on the client.
  useEffect(() => setMounted(true), []);

  const handlePaste = async () => {
    setMsg(null);
    const file = await readImageFromClipboard();
    if (file) onFile(file);
    else setMsg("No image found on the clipboard.");
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith("image/")) onFile(f);
      }}
      className="w-full max-w-2xl"
    >
      <div
        className={`panel checker flex flex-col items-center justify-center gap-5 px-8 py-16 text-center transition-colors ${
          over ? "bg-paper-2" : ""
        }`}
      >
        <FilePicker
          onFile={onFile}
          className="flex cursor-pointer flex-col items-center gap-4"
        >
          <div className="btn h-16 w-16 items-center justify-center">
            <Icon name="upload" size={30} />
          </div>
          <div>
            <p className="font-display text-base uppercase">Drop an image</p>
            <p className="mt-2 text-sm text-ink-2">click to browse</p>
          </div>
        </FilePicker>

        {mounted && canReadClipboard() && (
          <button
            onClick={handlePaste}
            className="btn px-4 py-2 text-[10px] font-display uppercase"
          >
            <Icon name="paste" size={18} />
            Paste from clipboard
          </button>
        )}

        <p className="max-w-sm text-xs text-ink-2">
          {msg ?? (
            <>
              PNG · JPG · WEBP · GIF — or press ⌘V / Ctrl+V. Converted in your
              browser; nothing is uploaded.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
