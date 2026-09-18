import type { ProductListItem } from './types';

/**
 * Pencarian katalog. Modul ini ikut ke bundel browser (dipakai CatalogClient),
 * jadi TIDAK boleh mengimpor apa pun yang khusus server.
 */

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Semua kata yang diketik harus ada di teks pencarian produk. */
export function searchProducts(list: ProductListItem[], query: string): ProductListItem[] {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (!terms.length) return list;

  return list.filter((product) => {
    const haystack = `${product.search} ${normalize(product.categoryName)}`;
    return terms.every((term) => haystack.includes(term));
  });
}
