import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';

/* ------------------------------------------------------------------ *
 * Tempat menyimpan data yang ditulis dari halaman admin.
 *
 * Di Netlify  : Netlify Blobs (sudah termasuk di runtime Next.js Netlify,
 *               tanpa layanan atau biaya tambahan).
 * Di lokal    : file biasa di folder data/admin/ supaya `npm run dev`
 *               tetap jalan tanpa perlu `netlify dev`.
 *
 * Situs statis tidak bisa menulis file saat berjalan, jadi data produk
 * buatan sendiri TIDAK boleh disimpan di data/*.json seperti hasil import.
 * ------------------------------------------------------------------ */

const STORE_NAME = 'catalog';
const LOCAL_DIR = path.join(process.cwd(), 'data', 'admin');
const LOCAL_MEDIA_DIR = path.join(LOCAL_DIR, 'media');

type BlobStore = {
  get(key: string, opts?: { type: 'text' }): Promise<string | null>;
  get(key: string, opts: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
  set(key: string, value: string | ArrayBuffer | Buffer, opts?: unknown): Promise<unknown>;
  delete(key: string): Promise<unknown>;
};

let blobStore: BlobStore | null | undefined;

/** null = Netlify Blobs tidak tersedia di lingkungan ini (mis. `next dev`). */
async function getBlobStore(): Promise<BlobStore | null> {
  if (blobStore !== undefined) return blobStore;
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({ name: STORE_NAME, consistency: 'strong' });
    // panggil sekali supaya error konfigurasi muncul sekarang, bukan nanti
    await store.get('__probe__', { type: 'text' });
    blobStore = store as unknown as BlobStore;
  } catch {
    blobStore = null;
  }
  return blobStore;
}

export async function storageKind(): Promise<'netlify-blobs' | 'local-file'> {
  return (await getBlobStore()) ? 'netlify-blobs' : 'local-file';
}

/* ----------------------------- teks/JSON ----------------------------- */

export async function readText(key: string): Promise<string | null> {
  const store = await getBlobStore();
  if (store) return store.get(key, { type: 'text' });

  try {
    return await fs.readFile(path.join(LOCAL_DIR, key), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Di Netlify, menulis ke filesystem itu sementara — hilang saat fungsi
 * dingin lagi. Kalau Blobs tidak tersedia di sana, lebih baik gagal dengan
 * pesan jelas daripada pura-pura tersimpan lalu data menghilang.
 */
function assertWritable(store: BlobStore | null): void {
  if (store) return;
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error(
      'Netlify Blobs tidak tersedia, jadi data tidak bisa disimpan permanen. ' +
        'Pastikan situs ini dideploy dengan @netlify/plugin-nextjs aktif.',
    );
  }
}

export async function writeText(key: string, value: string): Promise<void> {
  const store = await getBlobStore();
  if (store) {
    await store.set(key, value);
    return;
  }
  assertWritable(store);

  const file = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, value, 'utf8');
}

/* ------------------------------- media ------------------------------- */

const MEDIA_PREFIX = 'media/';

export type MediaFile = { bytes: ArrayBuffer; contentType: string };

export async function writeMedia(
  key: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const store = await getBlobStore();
  if (store) {
    await store.set(MEDIA_PREFIX + key, bytes, { metadata: { contentType } });
    return;
  }
  assertWritable(store);

  await fs.mkdir(LOCAL_MEDIA_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_MEDIA_DIR, key), Buffer.from(bytes));
  // simpan tipe-nya di sebelahnya supaya route bisa mengirim header yang benar
  await fs.writeFile(path.join(LOCAL_MEDIA_DIR, key + '.type'), contentType, 'utf8');
}

export async function readMedia(key: string): Promise<MediaFile | null> {
  const store = await getBlobStore();
  if (store) {
    const withMeta = store as unknown as {
      getWithMetadata(k: string, o: { type: 'arrayBuffer' }): Promise<{
        data: ArrayBuffer;
        metadata?: { contentType?: string };
      } | null>;
    };
    const result = await withMeta.getWithMetadata(MEDIA_PREFIX + key, { type: 'arrayBuffer' });
    if (!result) return null;
    return {
      bytes: result.data,
      contentType: result.metadata?.contentType ?? guessType(key),
    };
  }

  try {
    const bytes = await fs.readFile(path.join(LOCAL_MEDIA_DIR, key));
    let contentType = guessType(key);
    try {
      contentType = (await fs.readFile(path.join(LOCAL_MEDIA_DIR, key + '.type'), 'utf8')).trim();
    } catch {
      /* pakai hasil tebakan dari ekstensi */
    }
    return { bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), contentType };
  } catch {
    return null;
  }
}

export async function deleteMedia(key: string): Promise<void> {
  const store = await getBlobStore();
  if (store) {
    await store.delete(MEDIA_PREFIX + key);
    return;
  }
  await fs.rm(path.join(LOCAL_MEDIA_DIR, key), { force: true });
  await fs.rm(path.join(LOCAL_MEDIA_DIR, key + '.type'), { force: true });
}

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
};

export function guessType(name: string): string {
  return TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream';
}

export function extensionFor(contentType: string): string | null {
  const found = Object.entries(TYPES).find(([, type]) => type === contentType);
  return found ? found[0] : null;
}
