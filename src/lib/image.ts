import 'server-only';

import { writeMedia } from './store';

/* ------------------------------------------------------------------ *
 * Pemrosesan foto produk yang diunggah dari halaman admin.
 *
 * Foto dari HP biasanya 3-5 MB dan 4000 px — jauh lebih besar dari yang
 * dibutuhkan kartu produk. Dikecilkan dulu sebelum disimpan supaya hemat
 * penyimpanan dan cepat dibuka pembeli.
 * ------------------------------------------------------------------ */

/** Sisi terpanjang maksimum. Cukup untuk galeri di layar besar. */
const MAX_SIDE = 1400;
const QUALITY = 80;

/** Ditolak lebih awal supaya tidak membebani fungsi server. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

export type UploadResult =
  | { ok: true; url: string; bytes: number; note: string }
  | { ok: false; error: string };

function randomKey(ext: string): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${stamp}${random}${ext}`;
}

export async function storeUploadedImage(file: File): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, error: 'File kosong.' };

  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: `Tipe file ${file.type || 'tidak dikenal'} tidak didukung. Pakai JPG, PNG, atau WebP.` };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { ok: false, error: `Ukuran ${mb} MB melebihi batas 8 MB. Kecilkan dulu fotonya.` };
  }

  const original = Buffer.from(await file.arrayBuffer());

  // Kecilkan pakai sharp. Kalau gagal (mis. format aneh), simpan aslinya
  // supaya unggahan tidak hilang begitu saja.
  try {
    const { default: sharp } = await import('sharp');
    const image = sharp(original, { failOn: 'none' }).rotate(); // rotate() ikut EXIF orientasi HP
    const meta = await image.metadata();
    const longest = Math.max(meta.width ?? 0, meta.height ?? 0);

    const processed = await image
      .resize({
        width: longest > MAX_SIDE ? MAX_SIDE : undefined,
        height: undefined,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: QUALITY })
      .toBuffer();

    const key = randomKey('.webp');
    await writeMedia(key, toArrayBuffer(processed), 'image/webp');

    const before = (original.length / 1024).toFixed(0);
    const after = (processed.length / 1024).toFixed(0);
    return {
      ok: true,
      url: `/media/${key}`,
      bytes: processed.length,
      note: `${before} KB -> ${after} KB`,
    };
  } catch (error) {
    console.error('[image] sharp gagal, menyimpan file asli:', error);

    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
    const key = randomKey(ext);
    await writeMedia(key, toArrayBuffer(original), file.type);
    return {
      ok: true,
      url: `/media/${key}`,
      bytes: original.length,
      note: 'disimpan tanpa dikecilkan',
    };
  }
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}
