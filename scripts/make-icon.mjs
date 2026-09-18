/**
 * Membuat favicon dari logo toko.
 *
 *   npm run icon
 *
 * Membaca public/logo.png (PNG 8-bit RGBA) lalu menulis src/app/icon.png
 * berukuran 64x64 — Next.js otomatis memakainya sebagai favicon.
 * Jalankan ulang setiap kali kamu mengganti public/logo.png.
 *
 * Tanpa dependency: PNG dibaca & ditulis manual (zlib + CRC32).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync, crc32 } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'public', 'logo.png');
const OUT = path.join(ROOT, 'src', 'app', 'icon.png');
const SIZE = 64;

/* ---------------- baca PNG ---------------- */

function decodePng(buf) {
  let pos = 8;
  let header = null;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        color: data[9],
        interlace: data[12],
      };
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }

  if (!header || header.depth !== 8 || header.color !== 6 || header.interlace !== 0) {
    throw new Error(`Butuh PNG 8-bit RGBA tanpa interlace. Dapat: ${JSON.stringify(header)}`);
  }

  const { width, height } = header;
  const bpp = 4;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(height * stride);

  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      out[y * stride + x] = v & 0xff;
    }
  }
  return { width, height, pixels: out };
}

/* ---------------- perkecil ---------------- */

/** Rata-rata per kotak, alpha di-premultiply supaya tepi tidak jadi gelap. */
function resize({ width, height, pixels }, size) {
  const out = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    const y0 = Math.floor((y * height) / size);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / size));

    for (let x = 0; x < size; x++) {
      const x0 = Math.floor((x * width) / size);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / size));

      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * width + sx) * 4;
          const alpha = pixels[i + 3] / 255;
          r += pixels[i] * alpha;
          g += pixels[i + 1] * alpha;
          b += pixels[i + 2] * alpha;
          a += alpha;
          n++;
        }
      }

      const j = (y * size + x) * 4;
      if (a > 0) {
        out[j] = Math.round(r / a);
        out[j + 1] = Math.round(g / a);
        out[j + 2] = Math.round(b / a);
        out[j + 3] = Math.round((a / n) * 255);
      }
    }
  }
  return out;
}

/* ---------------- tulis PNG ---------------- */

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const body = Buffer.concat([head.subarray(4), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}

function encodePng(pixels, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA

  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const source = decodePng(readFileSync(SRC));
const icon = encodePng(resize(source, SIZE), SIZE);
writeFileSync(OUT, icon);

console.log(
  `OK: ${path.relative(ROOT, SRC)} (${source.width}x${source.height}) -> ` +
    `${path.relative(ROOT, OUT)} (${SIZE}x${SIZE}, ${(icon.length / 1024).toFixed(1)} KB)`,
);
