"use client";

import { useState } from "react";
import { Icon } from "./ui/Icon";
import { FilePicker } from "./ui/FilePicker";

export function Dropzone({ onFile }: { onFile: (file: File) => void }) {
  const [over, setOver] = useState(false);

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
      <FilePicker onFile={onFile} className="block cursor-pointer">
        <div
          className={`panel checker flex flex-col items-center justify-center gap-5 px-8 py-20 text-center transition-colors ${
            over ? "bg-paper-2" : ""
          }`}
        >
          <div className="btn h-16 w-16 items-center justify-center">
            <Icon name="upload" size={30} />
          </div>
          <div>
            <p className="font-display text-2xl uppercase tracking-wider">
              Drop an image
            </p>
            <p className="mt-2 text-sm text-ink-2">
              click to browse · or paste from clipboard
            </p>
          </div>
          <p className="max-w-sm text-xs text-ink-2">
            PNG · JPG · WEBP · GIF — converted entirely in your browser.
            Nothing is uploaded.
          </p>
        </div>
      </FilePicker>
    </div>
  );
}
