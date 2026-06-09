"use client";

import type { ReactNode } from "react";

export function FilePicker({
  onFile,
  children,
  className = "",
}: {
  onFile: (file: File) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
      {children}
    </label>
  );
}
