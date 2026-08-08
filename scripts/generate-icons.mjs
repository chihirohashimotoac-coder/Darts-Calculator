/**
 * PWA 用アイコンを生成するスクリプト。
 *
 * 外部の画像素材やロゴは一切使用せず、アプリ本体と同じ配置ルールで
 * ダーツボードをピクセル単位に描画して PNG を書き出す（依存パッケージなし）。
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/icons');

/** アプリと同じナンバー配置。 */
const BOARD_NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** src/geometry/dartboardGeometry.ts の RADII と同じ比率（missOuter = 205 を 1.0 とする）。 */
const R = {
  innerBull: 16 / 205,
  outerBull: 34 / 205,
  tripleInner: 90 / 205,
  tripleOuter: 110 / 205,
  doubleInner: 148 / 205,
  doubleOuter: 170 / 205,
  boardOuter: 1,
};

const COLORS = {
  background: [13, 15, 19, 255],
  surround: [11, 13, 17, 255],
  edge: [74, 82, 95, 255],
  dark: [28, 30, 35, 255],
  light: [240, 227, 194, 255],
  red: [208, 42, 50, 255],
  green: [23, 134, 74, 255],
  wire: [195, 201, 210, 255],
};

function colorAt(nx, ny, boardScale) {
  // nx, ny: -1..1 の正規化座標
  const r = Math.hypot(nx, ny) / boardScale;
  if (r > R.boardOuter) return COLORS.background;
  if (r > R.boardOuter - 0.02) return COLORS.edge;
  if (r > R.doubleOuter) return COLORS.surround;

  // ワイヤー（リング境界）
  const wireRadii = [R.doubleOuter, R.doubleInner, R.tripleOuter, R.tripleInner, R.outerBull];
  for (const wr of wireRadii) {
    if (Math.abs(r - wr) < 0.006) return COLORS.wire;
  }

  if (r <= R.innerBull) return COLORS.red;
  if (r <= R.outerBull) return COLORS.green;

  const deg = (Math.atan2(ny, nx) * 180) / Math.PI;
  const shifted = ((deg + 90 + 9) % 360 + 360) % 360;
  const index = Math.floor(shifted / 18) % BOARD_NUMBERS.length;

  // ウェッジ境界のワイヤー
  const withinWedge = shifted - index * 18;
  if (withinWedge < 0.55 || withinWedge > 17.45) return COLORS.wire;

  const isDarkWedge = index % 2 === 0;
  if (r <= R.tripleInner) return isDarkWedge ? COLORS.dark : COLORS.light;
  if (r <= R.tripleOuter) return isDarkWedge ? COLORS.red : COLORS.green;
  if (r <= R.doubleInner) return isDarkWedge ? COLORS.dark : COLORS.light;
  return isDarkWedge ? COLORS.red : COLORS.green;
}

/** 3x3 スーパーサンプリングで RGBA ピクセル列を作る。 */
function renderRgba(size, boardScale) {
  const data = Buffer.alloc(size * size * 4);
  const samples = 3;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          const nx = (px / size) * 2 - 1;
          const ny = (py / size) * 2 - 1;
          const c = colorAt(nx, ny, boardScale);
          r += c[0];
          g += c[1];
          b += c[2];
          a += c[3];
        }
      }
      const total = samples * samples;
      const offset = (y * size + x) * 4;
      data[offset] = Math.round(r / total);
      data[offset + 1] = Math.round(g / total);
      data[offset + 2] = Math.round(b / total);
      data[offset + 3] = Math.round(a / total);
    }
  }
  return data;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function writeIcon(fileName, size, boardScale) {
  const png = encodePng(size, renderRgba(size, boardScale));
  writeFileSync(resolve(OUT_DIR, fileName), png);
  console.log(`generated ${fileName} (${size}x${size}, ${png.length} bytes)`);
}

mkdirSync(OUT_DIR, { recursive: true });

writeIcon('icon-192.png', 192, 0.98);
writeIcon('icon-512.png', 512, 0.98);
// maskable はセーフゾーン（中央 80%）に収める
writeIcon('icon-maskable-512.png', 512, 0.72);
writeIcon('apple-touch-icon-180.png', 180, 0.9);
writeIcon('favicon-32.png', 32, 0.98);
