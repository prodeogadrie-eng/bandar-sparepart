/**
 * Buang tanda diakritik (é -> e, ü -> u).
 *
 * Ditulis pakai perbandingan kode titik, bukan regex rentang, supaya source
 * ini tetap murni ASCII — karakter penggabung tidak terlihat di editor dan
 * mudah rusak saat file disunting lewat alat lain.
 */
const COMBINING_START = 0x0300;
const COMBINING_END = 0x036f;

function stripDiacritics(text: string): string {
  let out = '';
  for (const char of text.normalize('NFD')) {
    const code = char.codePointAt(0) ?? 0;
    if (code < COMBINING_START || code > COMBINING_END) out += char;
  }
  return out;
}

/** Ubah teks bebas jadi slug URL. */
export function slugify(text: string): string {
  return stripDiacritics(text.toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Slug yang belum dipakai produk lain. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = slugify(base) || 'produk';
  if (!used.has(root)) return root;
  for (let i = 2; i < 500; i++) {
    const candidate = `${root}-${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}
