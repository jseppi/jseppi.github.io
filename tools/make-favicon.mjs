// make-favicon.mjs — generates favicon.ico, favicon.svg, apple-touch-icon.png
// and icon-512.png for jseppi.github.io from a small set of geometric
// letterform constants. Zero third-party dependencies: only Node built-ins.
//
// Run with:  node tools/make-favicon.mjs   (from the repo root)

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// DESIGN CONSTANTS — everything about the mark lives here. Tweak freely; the
// rasteriser, the SVG emitter, and every output size all derive from this.
// ---------------------------------------------------------------------------

// The whole mark is designed on a 40x40 unit grid, origin top-left.
const DESIGN_SIZE = 40;

const COLORS = {
  ink: "#14110E",
  vermilion: "#D6321B",
  cream: "#E8DCC4",
};

// Each letterform is a list of axis-aligned rectangles [x, y, w, h] in
// CELL-LOCAL coordinates (a 15x15 cell, stroke width 3).
const LETTER_SHAPES = {
  // Vertical stem on the right, bottom bar, short tick rising at the left.
  J: [
    [12, 0, 3, 12],
    [0, 12, 15, 3],
    [0, 9, 3, 3],
  ],
  // Top bar, upper-left stem, middle bar, lower-right stem, bottom bar.
  S: [
    [0, 0, 15, 3],
    [0, 3, 3, 3],
    [0, 6, 15, 3],
    [12, 9, 3, 3],
    [0, 12, 15, 3],
  ],
};

// Where each letter cell sits in the 40x40 design space, and what colour it
// is drawn in. Top row: two J's. Bottom row: two S's, shifted +3 to the
// right, alternating ink/vermilion like a checkerboard.
// Gaps matter more than margins here: at 16x16 one design unit is 0.4px, so a
// 1-unit gutter disappears entirely and the two rows fuse into a single blob.
// Cells are 15 wide, so a column gap of 3 and a row gap of 4 are what survive
// downsampling. The bottom row is shifted +3 to echo the hero's row indents,
// which leaves the combined bounding box at x 2..38 — even margins either side.
const PLACEMENTS = [
  { letter: "J", x: 2, y: 3, color: COLORS.ink },
  { letter: "J", x: 20, y: 3, color: COLORS.vermilion },
  { letter: "S", x: 5, y: 22, color: COLORS.vermilion },
  { letter: "S", x: 23, y: 22, color: COLORS.ink },
];

// Flatten PLACEMENTS + LETTER_SHAPES into one ordered list of absolute
// rectangles with colour, so rasterisation and SVG emission both read from a
// single derived source instead of duplicating coordinates.
const RECTS = PLACEMENTS.flatMap(({ letter, x, y, color }) =>
  LETTER_SHAPES[letter].map(([rx, ry, rw, rh]) => ({
    x: x + rx,
    y: y + ry,
    w: rw,
    h: rh,
    color,
  }))
);

// ---------------------------------------------------------------------------
// RASTERISATION — analytic coverage anti-aliasing.
//
// Every shape is an axis-aligned rectangle, so exact pixel coverage is cheap:
// for output pixel (px, py) its footprint in design space is the box
// [px*S/N, (px+1)*S/N] x [py*S/N, (py+1)*S/N] (S = DESIGN_SIZE, N = target
// size in pixels). For a given rect, the overlap along each axis is a plain
// interval intersection; multiplying the two overlap lengths and dividing by
// the pixel's own area gives the fraction of the pixel the rect covers
// (1.0 = fully inside, 0.0 = no overlap, in between = a clean straight edge).
// That fraction is used as alpha in a standard source-over composite against
// whatever is already in the pixel, so overlapping/adjacent rects blend
// correctly and edges come out smooth even at 16x16.
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function renderRGBA(N) {
  const cream = hexToRgb(COLORS.cream);
  const rgba = Buffer.alloc(N * N * 4);

  // Fill background (fully opaque cream).
  for (let i = 0; i < N * N; i++) {
    rgba[i * 4] = cream[0];
    rgba[i * 4 + 1] = cream[1];
    rgba[i * 4 + 2] = cream[2];
    rgba[i * 4 + 3] = 255;
  }

  const scale = DESIGN_SIZE / N;

  for (let py = 0; py < N; py++) {
    const y0 = py * scale;
    const y1 = (py + 1) * scale;
    for (let px = 0; px < N; px++) {
      const x0 = px * scale;
      const x1 = (px + 1) * scale;
      const pixelArea = (x1 - x0) * (y1 - y0);
      const idx = (py * N + px) * 4;

      for (const rect of RECTS) {
        const overlapX = Math.max(0, Math.min(x1, rect.x + rect.w) - Math.max(x0, rect.x));
        if (overlapX <= 0) continue;
        const overlapY = Math.max(0, Math.min(y1, rect.y + rect.h) - Math.max(y0, rect.y));
        if (overlapY <= 0) continue;

        const coverage = (overlapX * overlapY) / pixelArea;
        if (coverage <= 0) continue;

        const [r, g, b] = hexToRgb(rect.color);
        // Straight source-over: out = src*a + dst*(1-a), per channel.
        rgba[idx] = r * coverage + rgba[idx] * (1 - coverage);
        rgba[idx + 1] = g * coverage + rgba[idx + 1] * (1 - coverage);
        rgba[idx + 2] = b * coverage + rgba[idx + 2] * (1 - coverage);
        rgba[idx + 3] = 255;
      }
    }
  }

  return rgba;
}

// ---------------------------------------------------------------------------
// CRC32 — standard table-based implementation (polynomial 0xEDB88320).
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------------------
// PNG ENCODING — hand-rolled, built-in zlib only for the DEFLATE step.
// ---------------------------------------------------------------------------

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // colour type: RGBA
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdr = pngChunk("IHDR", ihdrData);

  // Each scanline is prefixed with a filter-type byte; we use filter 0
  // (None) throughout for simplicity.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (stride + 1);
    raw[rawOffset] = 0; // filter type: None
    rgbaBuffer.copy(raw, rawOffset + 1, y * stride, y * stride + stride);
  }
  const compressed = deflateSync(raw, { level: 9 });
  const idat = pngChunk("IDAT", compressed);

  const iend = pngChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// ---------------------------------------------------------------------------
// ICO ENCODING — modern ICO embedding PNG payloads directly (supported by
// every browser in current use).
// ---------------------------------------------------------------------------

function encodeICO(entries) {
  const count = entries.length;
  const headerSize = 6 + 16 * count;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const payloads = [];
  // Offsets are computed by walking through the payloads in order, starting
  // right after the fixed-size header + directory block.
  let offset = headerSize;
  for (const { size, pngBuffer } of entries) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size; // width
    entry[1] = size >= 256 ? 0 : size; // height
    entry[2] = 0; // colour count (0 = no palette)
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngBuffer.length, 8); // data size
    entry.writeUInt32LE(offset, 12); // data offset
    dirEntries.push(entry);
    payloads.push(pngBuffer);
    offset += pngBuffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...payloads]);
}

// ---------------------------------------------------------------------------
// SVG ENCODING — built from the same RECTS list used for rasterisation.
// ---------------------------------------------------------------------------

function encodeSVG() {
  const lines = [];
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DESIGN_SIZE} ${DESIGN_SIZE}" shape-rendering="crispEdges">`
  );
  lines.push(
    `  <rect x="0" y="0" width="${DESIGN_SIZE}" height="${DESIGN_SIZE}" fill="${COLORS.cream}" />`
  );
  for (const rect of RECTS) {
    lines.push(
      `  <rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${rect.color}" />`
    );
  }
  lines.push("</svg>");
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// MAIN — write the four output files.
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function writeAndReport(filePath, buffer) {
  writeFileSync(filePath, buffer);
  const rel = path.relative(repoRoot, filePath);
  console.log(`${rel}: ${buffer.length} bytes`);
}

// ICO: 16x16, 32x32, 48x48
const icoEntries = [16, 32, 48].map((size) => ({
  size,
  pngBuffer: encodePNG(size, size, renderRGBA(size)),
}));
writeAndReport(path.join(repoRoot, "favicon.ico"), encodeICO(icoEntries));

// SVG
writeAndReport(path.join(repoRoot, "favicon.svg"), Buffer.from(encodeSVG(), "utf8"));

// apple-touch-icon.png (180x180)
writeAndReport(
  path.join(repoRoot, "apple-touch-icon.png"),
  encodePNG(180, 180, renderRGBA(180))
);

// icon-512.png (512x512)
writeAndReport(path.join(repoRoot, "icon-512.png"), encodePNG(512, 512, renderRGBA(512)));
