import { readMedia } from '@/lib/store';

/**
 * Menyajikan foto yang diunggah dari halaman admin.
 *
 * Foto tidak bisa ditaruh di public/ karena situs statis tidak bisa menulis
 * file saat berjalan, jadi disimpan di Netlify Blobs lalu dikirim dari sini.
 * Nama file selalu unik, jadi aman di-cache selamanya.
 */
export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;

  // jaga-jaga terhadap percobaan keluar folder
  if (!/^[A-Za-z0-9._-]+$/.test(key)) {
    return new Response('Nama file tidak valid', { status: 400 });
  }

  const file = await readMedia(key);
  if (!file) return new Response('Foto tidak ditemukan', { status: 404 });

  return new Response(file.bytes, {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(file.bytes.byteLength),
    },
  });
}
