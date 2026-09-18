import 'server-only';

import { unstable_cache } from 'next/cache';
import siteConfig from '@config';
import { readAdminData, type ManualProduct } from './admin-data';
import { applyOverrides } from './overrides';
import { buildSearchText } from './search-text';
import { shopeeCategories, shopeeProducts } from './shopee-source';
import { slugify } from './slug';
import { excerptOf } from './text';
import type { CategorySummary, Product, ProductListItem } from './types';

/* ------------------------------------------------------------------ *
 * Katalog gabungan: hasil import Shopee + produk & editan dari admin.
 *
 * Dibaca saat request (bukan saat build) supaya perubahan dari halaman
 * admin langsung terlihat. Hasilnya di-cache dan hanya dihitung ulang
 * setelah admin menyimpan sesuatu (revalidateTag).
 * ------------------------------------------------------------------ */

export const CATALOG_TAG = 'catalog';

export type CatalogData = {
  products: Product[];
  categories: CategorySummary[];
  /** Bentuk ringkas untuk kartu; ini yang dikirim ke browser. */
  list: ProductListItem[];
  featured: ProductListItem[];
  manualCount: number;
};

/** Produk buatan sendiri disamakan bentuknya dengan produk hasil import. */
function manualToProduct(manual: ManualProduct): Product {
  const categoryName = manual.categoryName.trim() || 'Lain-lain';
  return {
    id: manual.id,
    slug: manual.slug,
    name: manual.name,
    sku: manual.sku,
    description: manual.description,
    excerpt: excerptOf(manual.description || manual.name),
    price: manual.price,
    priceMax: manual.price,
    hasPriceRange: false,
    stock: manual.stock,
    inStock: manual.stock > 0,
    category: {
      id: null,
      name: categoryName,
      slug: slugify(categoryName),
      path: [categoryName],
    },
    images: manual.images.filter(Boolean),
    variants: [],
    sold: 0,
    weightGram: manual.weightGram,
    dimensions: { length: null, width: null, height: null },
    shipDays: manual.shipDays,
  };
}

export function toListItem(product: Product): ProductListItem {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    hasPriceRange: product.hasPriceRange,
    stock: product.stock,
    inStock: product.inStock,
    image: product.images[0] ?? null,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    search: buildSearchText(product),
  };
}

function pickFeatured(products: Product[], forced: string[]): Product[] {
  const { featuredSlugs, featuredCount } = siteConfig.catalog;
  const wanted = [...forced, ...featuredSlugs];

  const picked: Product[] = [];
  for (const slug of wanted) {
    const product = products.find((p) => p.slug === slug);
    if (product && !picked.includes(product)) picked.push(product);
  }
  if (picked.length >= featuredCount) return picked.slice(0, featuredCount);

  const auto = products.filter((p) => p.inStock && p.images.length > 0 && !picked.includes(p));
  const fallback = auto.length ? auto : products.filter((p) => !picked.includes(p));

  return [...picked, ...fallback].slice(0, featuredCount);
}

async function loadCatalog(): Promise<CatalogData> {
  const admin = await readAdminData();

  const manual = admin.products.filter((p) => !p.hidden).map(manualToProduct);

  // Produk sendiri ditaruh di depan supaya barang baru tampil lebih dulu.
  const all = [...manual, ...shopeeProducts];

  // Kategori dari produk sendiri ikut didaftarkan supaya bisa dipakai override.
  const manualCategories: CategorySummary[] = [];
  for (const product of manual) {
    if (!manualCategories.some((c) => c.slug === product.category.slug)) {
      manualCategories.push({ slug: product.category.slug, name: product.category.name, count: 0 });
    }
  }

  const merged = applyOverrides(
    all,
    [...shopeeCategories, ...manualCategories],
    admin.overrides,
  );

  const forcedFeatured = [
    ...admin.products.filter((p) => p.featured && !p.hidden).map((p) => p.slug),
    ...merged.featuredSlugs,
  ];

  return {
    products: merged.products,
    categories: merged.categories,
    list: merged.products.map(toListItem),
    featured: pickFeatured(merged.products, forcedFeatured).map(toListItem),
    manualCount: manual.length,
  };
}

/**
 * Cache dengan tag: dihitung sekali, lalu dipakai ulang sampai halaman admin
 * menyimpan sesuatu (updateTag). Tanpa ini setiap kunjungan akan membaca
 * penyimpanan dan menyusun ulang teks pencarian semua produk.
 *
 * `revalidate` adalah jaring pengaman, bukan jalur utama. Saat build berjalan
 * di server Netlify, penyimpanan admin bisa saja belum terbaca — tanpa batas
 * waktu ini, halaman hasil build akan bertahan tanpa produk buatan sendiri
 * sampai ada penyimpanan berikutnya dari admin.
 */
const SAFETY_REVALIDATE_SECONDS = 300;

export const getCatalog = unstable_cache(loadCatalog, ['catalog-v1'], {
  tags: [CATALOG_TAG],
  revalidate: SAFETY_REVALIDATE_SECONDS,
});

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug);
}

/** Produk lain di kategori yang sama, untuk bagian "Produk lainnya". */
export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<ProductListItem[]> {
  const { products } = await getCatalog();
  const sameCategory = products.filter(
    (p) => p.slug !== product.slug && p.category.slug === product.category.slug,
  );
  const rest = products.filter(
    (p) => p.slug !== product.slug && p.category.slug !== product.category.slug,
  );
  return [...sameCategory, ...rest].slice(0, limit).map(toListItem);
}
