// Recursive Bayer (ordered-dither) threshold matrices.
// Returns a flat array of normalized thresholds in [0,1), row-major, size×size.

function buildBayer(size: 4 | 8): { data: Float32Array; size: number } {
  let m: number[][] = [[0]];
  const order = Math.log2(size);
  for (let o = 0; o < order; o++) {
    const n = m.length;
    const next: number[][] = Array.from({ length: n * 2 }, () =>
      new Array(n * 2).fill(0),
    );
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = m[y][x];
        next[y][x] = 4 * v;
        next[y][x + n] = 4 * v + 2;
        next[y + n][x] = 4 * v + 3;
        next[y + n][x + n] = 4 * v + 1;
      }
    }
    m = next;
  }
  const total = size * size;
  const data = new Float32Array(total);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Center each level: (v + 0.5) / total → thresholds in (0,1).
      data[y * size + x] = (m[y][x] + 0.5) / total;
    }
  }
  return { data, size };
}

export const BAYER_4 = buildBayer(4);
export const BAYER_8 = buildBayer(8);
