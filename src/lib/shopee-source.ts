import raw from '../../data/products.json';
import type { Catalog, CategorySummary, Product } from './types';

/**
 * Data hasil `npm run import` dari export Shopee.
 *
 * Ini dibaca saat build dan tidak pernah berubah saat situs berjalan.
 * Produk yang kamu tambahkan sendiri lewat halaman admin datang dari
 * tempat lain (lihat src/lib/store.ts) lalu digabung di src/lib/catalog.ts.
 */

/**
 * `remoteImages` ditulis importer sebagai catatan URL asli Shopee, tapi tidak
 * pernah dibaca situs ini. Field itu juga tidak ada di tipe `Product`, jadi
 * kalau tidak dibuang di sini ia diam-diam ikut terkirim ke browser setiap kali
 * objek produk dilempar ke komponen client.
 */
type RawProduct = Product & { remoteImages?: string[] };

const catalog = raw as unknown as Catalog;

export const shopeeProducts: Product[] = (catalog.products as RawProduct[]).map(
  ({ remoteImages, ...rest }) => rest,
);

export const shopeeCategories: CategorySummary[] = catalog.categories;
export const shopeeGeneratedAt = catalog.generatedAt;
