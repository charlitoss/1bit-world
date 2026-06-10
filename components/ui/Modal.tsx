"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop — always a dark dim, independent of theme. */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="panel relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-ink/15 px-4 py-3">
          <h2 className="font-display text-sm uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="btn px-2 py-1.5"
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
