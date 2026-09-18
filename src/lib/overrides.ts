import overridesRaw from '../../data/overrides.json';
import { excerptOf } from './text';
import type { CategorySummary, Product } from './types';

/* ------------------------------------------------------------------ *
 * Lapisan override.
 *
 * data/products.json  = hasil mentah `npm run import` (ditimpa tiap import)
 * data/overrides.json = editan manual kamu       (tidak pernah ditimpa)
 *
 * Keduanya digabung di sini setiap kali situs dibangun, jadi hasil import
 * tetap segar tapi editanmu tidak pernah hilang.
 * ------------------------------------------------------------------ */

export type ProductOverride = {
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  excerpt?: string;
  price?: number;
  priceMax?: number;
  stock?: number;
  images?: string[];
  weightGram?: number | null;
  shipDays?: number | null;
  /** Sembunyikan produk dari seluruh situs. */
  hidden?: boolean;
  /** Paksa tampil di "Produk unggulan" halaman depan. */
  featured?: boolean;
  /** Pindahkan produk ke kategori lain (pakai slug kategori). */
  categorySlug?: string;
};

export type CategoryOverride = {
  name?: string;
  hidden?: boolean;
};

type OverrideFile = {
  products?: Record<string, ProductOverride>;
  categories?: Record<string, CategoryOverride>;
};

const PRODUCT_FIELDS = new Set<keyof ProductOverride>([
  'name', 'slug', 'sku', 'description', 'excerpt', 'price', 'priceMax', 'stock',
  'images', 'weightGram', 'shipDays', 'hidden', 'featured', 'categorySlug',
]);

const CATEGORY_FIELDS = new Set<keyof CategoryOverride>(['name', 'hidden']);

/** Kunci berawalan "_" adalah catatan/contoh, bukan data. */
const isNote = (key: string) => key.startsWith('_');

function stripNotes<T>(record: Record<string, T> | undefined): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(record ?? {})) {
    if (!isNote(key)) out[key] = value;
  }
  return out;
}

const file = overridesRaw as OverrideFile;
const fileProductOverrides = stripNotes(file.products);
const categoryOverrides = stripNotes(file.categories);

/** Peringatan hanya saat build/dev di server, tidak ikut ke browser. */
function warn(message: string) {
  if (typeof window === 'undefined') console.warn(`[overrides] ${message}`);
}

function checkFields(scope: string, key: string, value: object, allowed: Set<string>) {
  for (const field of Object.keys(value)) {
    if (isNote(field)) continue;
    if (!allowed.has(field)) {
      warn(`${scope} "${key}": field "${field}" tidak dikenal, diabaikan.`);
    }
  }
}

function mergeProduct(product: Product, override: ProductOverride): Product {
  const next: Product = { ...product };

  if (override.name) next.name = override.name;
  if (override.slug) next.slug = override.slug;
  if (override.sku !== undefined) next.sku = override.sku;

  if (override.description !== undefined) {
    next.description = override.description;
    // excerpt ikut deskripsi baru, kecuali ditulis sendiri
    next.excerpt = override.excerpt ?? excerptOf(override.description || next.name);
  }
  if (override.excerpt !== undefined) next.excerpt = override.excerpt;

  if (typeof override.price === 'number') {
    next.price = override.price;
    next.priceMax = typeof override.priceMax === 'number' ? override.priceMax : override.price;
  } else if (typeof override.priceMax === 'number') {
    next.priceMax = override.priceMax;
  }
  next.hasPriceRange = next.priceMax > next.price;

  if (typeof override.stock === 'number') {
    next.stock = override.stock;
    next.inStock = override.stock > 0;
  }

  if (Array.isArray(override.images)) next.images = override.images.filter(Boolean);
  if (override.weightGram !== undefined) next.weightGram = override.weightGram;
  if (override.shipDays !== undefined) next.shipDays = override.shipDays;

  return next;
}

export type MergedCatalog = {
  products: Product[];
  categories: CategorySummary[];
  /** Slug produk yang dipaksa jadi unggulan lewat override. */
  featuredSlugs: string[];
};

export function applyOverrides(
  rawProducts: Product[],
  rawCategories: CategorySummary[],
  /** Override dari halaman admin. Menimpa isi data/overrides.json. */
  extraProducts: Record<string, ProductOverride> = {},
): MergedCatalog {
  const productOverrides = { ...fileProductOverrides, ...stripNotes(extraProducts) };
  const usedKeys = new Set<string>();
  const featuredSlugs: string[] = [];

  // nama kategori: dari hasil import, lalu ditimpa override
  const categoryNames = new Map(rawCategories.map((c) => [c.slug, c.name]));
  const hiddenCategories = new Set<string>();

  for (const [slug, override] of Object.entries(categoryOverrides)) {
    checkFields('Kategori', slug, override, CATEGORY_FIELDS as Set<string>);
    if (!categoryNames.has(slug)) {
      warn(`Kategori "${slug}" tidak ada di katalog. Cek lagi slug-nya.`);
    }
    if (override.name) categoryNames.set(slug, override.name);
    if (override.hidden) hiddenCategories.add(slug);
  }

  const products: Product[] = [];

  for (const product of rawProducts) {
    // cocokkan lewat slug dulu, lalu Kode Produk
    const key = productOverrides[product.slug]
      ? product.slug
      : productOverrides[product.id]
        ? product.id
        : null;

    const override = key ? productOverrides[key] : undefined;
    if (key) {
      usedKeys.add(key);
      checkFields('Produk', key, override!, PRODUCT_FIELDS as Set<string>);
    }

    if (override?.hidden) continue;

    let merged = override ? mergeProduct(product, override) : product;

    // pindah kategori
    const targetSlug = override?.categorySlug;
    if (targetSlug) {
      if (!categoryNames.has(targetSlug)) {
        warn(`Produk "${key}": categorySlug "${targetSlug}" tidak dikenal, diabaikan.`);
      } else {
        merged = {
          ...merged,
          category: { ...merged.category, slug: targetSlug, name: categoryNames.get(targetSlug)! },
        };
      }
    }

    // nama kategori hasil override
    const currentName = categoryNames.get(merged.category.slug);
    if (currentName && currentName !== merged.category.name) {
      merged = { ...merged, category: { ...merged.category, name: currentName } };
    }

    if (hiddenCategories.has(merged.category.slug)) continue;

    if (override?.featured) featuredSlugs.push(merged.slug);

    products.push(merged);
  }

  for (const key of Object.keys(productOverrides)) {
    if (!usedKeys.has(key)) {
      warn(`Produk "${key}" tidak ditemukan di katalog. Salah ketik slug / Kode Produk?`);
    }
  }

  // kategori dibangun ulang dari produk yang tersisa supaya jumlahnya akurat
  const categories: CategorySummary[] = [];
  const seen = new Map<string, CategorySummary>();
  for (const product of products) {
    const { slug, name } = product.category;
    if (!seen.has(slug)) {
      const entry = { slug, name, count: 0 };
      seen.set(slug, entry);
      categories.push(entry);
    }
    seen.get(slug)!.count++;
  }
  categories.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'id'));

  return { products, categories, featuredSlugs };
}
