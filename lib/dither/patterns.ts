// Cell render patterns. Each "ink" cell is drawn by stamping a motif at the
// current pixel size, turning the dithered mask into crosshatch / halftone /
// line-art looks instead of plain squares.
import type { PatternId } from "./types";

export interface PatternDef {
  id: PatternId;
  name: string;
}

export const PATTERNS: PatternDef[] = [
  { id: "square", name: "Square" },
  { id: "dot", name: "Dot" },
  { id: "ring", name: "Ring" },
  { id: "plus", name: "Plus" },
  { id: "cross", name: "Cross" },
  { id: "diamond", name: "Diamond" },
  { id: "hline", name: "Lines" },
  { id: "vline", name: "Bars" },
  { id: "slant", name: "Slant" },
];

/** Build a scale×scale boolean stamp (1 = ink) for a pattern. Computed once per render. */
export function buildStamp(pattern: PatternId, scale: number): Uint8Array {
  const s = Math.max(1, Math.round(scale));
  const stamp = new Uint8Array(s * s);
  if (pattern === "square" || s <= 1) {
    stamp.fill(1);
    return stamp;
  }
  const c = (s - 1) / 2;
  const t = Math.max(1, s * 0.26); // line thickness
  const r = s * 0.46; // round-shape radius
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const dx = x - c;
      const dy = y - c;
      let ink = false;
      switch (pattern) {
        case "dot":
          ink = dx * dx + dy * dy <= r * r;
          break;
        case "ring": {
          const dist = Math.sqrt(dx * dx + dy * dy);
          ink = Math.abs(dist - r * 0.85) <= t * 0.6;
          break;
        }
        case "plus":
          ink = Math.abs(dx) < t || Math.abs(dy) < t;
          break;
        case "cross":
          ink = Math.abs(x - y) < t || Math.abs(s - 1 - x - y) < t;
          break;
        case "diamond":
          ink = Math.abs(dx) + Math.abs(dy) <= r;
          break;
        case "hline":
          ink = Math.abs(dy) < t;
          break;
        case "vline":
          ink = Math.abs(dx) < t;
          break;
        case "slant":
          // (x+y) mod s is continuous across cell borders → unbroken diagonals.
          ink = Math.abs(((x + y) % s) - c) < t;
          break;
        default:
          ink = true;
      }
      stamp[y * s + x] = ink ? 1 : 0;
    }
  }
  return stamp;
}
