// Generates public/sample.png — a dependency-free test image with smooth
// gradients and hard edges, so the ditherer has both tone and detail to show off.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const W = 720;
const H = 480;

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

const raw = Buffer.alloc(H * (1 + W * 4));
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0; // filter: none
  for (let x = 0; x < W; x++) {
    const nx = x / W;
    const ny = y / H;
    // Radial vignette
    const dx = nx - 0.5;
    const dy = ny - 0.5;
    const d = Math.sqrt(dx * dx + dy * dy) / 0.7;
    const vig = 1 - d;
    // Diagonal ramp + soft waves for mid-tones
    const ramp = 0.5 + 0.5 * Math.sin(nx * 6.0 + ny * 3.0);
    let base = 0.55 * vig + 0.45 * ramp;
    // A couple of hard-edged shapes
    const inCircle = (cx, cy, r) =>
      (nx - cx) * (nx - cx) + (ny - cy) * (ny - cy) < r * r;
    if (inCircle(0.3, 0.4, 0.16)) base = 0.92;
    if (inCircle(0.68, 0.6, 0.12)) base = 0.12;
    if (ny > 0.82) base = nx; // bottom gradient bar
    const v = Math.max(0, Math.min(255, Math.round(base * 255)));
    raw[o++] = v; // R
    raw[o++] = Math.max(0, Math.min(255, Math.round(v * 0.92))); // G (warm)
    raw[o++] = Math.max(0, Math.min(255, Math.round(v * 0.8))); // B
    raw[o++] = 255; // A
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync("public", { recursive: true });
writeFileSync("public/sample.png", png);
console.log(`wrote public/sample.png (${png.length} bytes, ${W}×${H})`);
