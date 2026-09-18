import type { Product } from './types';

/**
 * Menyusun teks pencarian ringkas untuk satu produk.
 *
 * Halaman katalog mencari di browser, jadi teks ini ikut terkirim ke setiap
 * pengunjung. Mengirim deskripsi penuh boros (28% payload katalog), tapi
 * membuangnya juga merugikan: nama merek dan tipe unit seperti "Sinotruk HOWO"
 * hanya muncul di deskripsi, dan itu justru kata yang dipakai pembeli.
 *
 * Kompromi: ambil nama, SKU, kategori, lalu dari deskripsi ambil
 * kata kunci saja — nomor part dan kata bermakna, tanpa kata sambung.
 */

/** Kata sambung/pengisi yang tidak berguna untuk pencarian. */
const STOPWORDS = new Set([
  'yang', 'dan', 'untuk', 'dengan', 'pada', 'atau', 'ini', 'itu', 'dari',
  'adalah', 'akan', 'tidak', 'bisa', 'juga', 'dalam', 'oleh', 'sebagai',
  'agar', 'saat', 'tanpa', 'lebih', 'sudah', 'masih', 'harus', 'kami',
  'anda', 'jika', 'karena', 'secara', 'serta', 'maupun', 'bagi', 'telah',
  'dapat', 'antara', 'hingga', 'setiap', 'sangat', 'namun', 'tetapi',
  'maka', 'para', 'suatu', 'seperti', 'berupa', 'menjadi', 'melakukan',
  'the', 'and', 'for', 'with', 'this', 'that', 'are', 'from',
]);

const MAX_LENGTH = 220;

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Nomor part: ada angkanya dan cukup panjang. */
const isPartNumber = (token: string) => token.length >= 5 && /\d/.test(token);

export function buildSearchText(product: Product): string {
  const tokens: string[] = [];
  const seen = new Set<string>();

  const push = (text: string) => {
    for (const token of normalize(text).split(' ')) {
      if (!token || seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
    }
  };

  // selalu masuk: yang paling sering dicari
  push(product.name);
  push(product.sku);
  push(product.category.name);
  push(product.category.path.join(' '));

  // dari deskripsi: nomor part dulu, baru kata bermakna
  const descTokens = normalize(product.description).split(' ').filter(Boolean);
  for (const token of descTokens) {
    if (isPartNumber(token)) push(token);
  }
  for (const token of descTokens) {
    if (token.length >= 4 && !STOPWORDS.has(token)) push(token);
  }

  // batasi panjangnya supaya payload tetap bisa diprediksi
  let out = '';
  for (const token of tokens) {
    if (out.length + token.length + 1 > MAX_LENGTH) break;
    out += (out ? ' ' : '') + token;
  }
  return out;
}
