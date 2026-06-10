import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "upload"
  | "download"
  | "copy"
  | "paste"
  | "share"
  | "reset"
  | "undo"
  | "redo"
  | "image"
  | "invert"
  | "close"
  | "check"
  | "github"
  | "sun"
  | "moon"
  | "sliders";

const PATHS: Record<IconName, ReactNode> = {
  upload: (
    <>
      <path d="M12 4v11" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 19h16" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" />
      <path d="M5 16V5h11" />
    </>
  ),
  paste: (
    <>
      <rect x="6" y="5" width="12" height="16" />
      <path d="M9 5V3h6v2" />
      <path d="M9 11h6M9 15h6" />
    </>
  ),
  share: (
    <>
      <path d="M12 3v11" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v8h14v-8" />
    </>
  ),
  reset: (
    <>
      <path d="M5 12a7 7 0 1 1 2 5" />
      <path d="M4 20v-5h5" />
    </>
  ),
  undo: (
    <>
      <path d="M9 7L5 11l4 4" />
      <path d="M5 11h8a5 5 0 0 1 5 5v1" />
    </>
  ),
  redo: (
    <>
      <path d="M15 7l4 4-4 4" />
      <path d="M19 11h-8a5 5 0 0 0-5 5v1" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" />
      <circle cx="9" cy="10" r="1.4" />
      <path d="M5 17l5-5 4 4 2-2 3 3" />
    </>
  ),
  invert: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  check: <path d="M5 12l5 5 9-11" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  moon: (
    <path
      d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"
      fill="currentColor"
      stroke="none"
    />
  ),
  github: (
    <path
      d="M12 3a9 9 0 0 0-2.8 17.5c.4.1.6-.2.6-.4v-1.7c-2.5.5-3-1.2-3-1.2-.4-1-1-1.3-1-1.3-.8-.6 0-.6 0-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.4 0-1 .3-1.8.9-2.4-.1-.3-.4-1.2.1-2.4 0 0 .7-.2 2.4.9a8.4 8.4 0 0 1 4.4 0c1.7-1.1 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.4.6.6.9 1.4.9 2.4 0 3.4-2.1 4.2-4.1 4.4.3.3.6.8.6 1.7v2.5c0 .2.2.5.6.4A9 9 0 0 0 12 3z"
      fill="currentColor"
      stroke="none"
    />
  ),
  sliders: (
    <>
      <path d="M6 4v6M6 14v6" />
      <path d="M12 4v3M12 11v9" />
      <path d="M18 4v9M18 17v3" />
      <rect x="4" y="10" width="4" height="4" />
      <rect x="10" y="7" width="4" height="4" />
      <rect x="16" y="13" width="4" height="4" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
