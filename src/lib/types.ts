export type Category = {
  id: string | null;
  name: string;
  slug: string;
  path: string[];
};

export type Variant = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  description: string;
  excerpt: string;
  price: number;
  priceMax: number;
  hasPriceRange: boolean;
  stock: number;
  inStock: boolean;
  category: Category;
  images: string[];
  variants: Variant[];
  sold: number;
  weightGram: number | null;
  dimensions: { length: number | null; width: number | null; height: number | null };
  shipDays: number | null;
};

/**
 * Versi ringkas produk untuk daftar/kartu.
 *
 * Halaman katalog mengirim seluruh daftar produk ke browser, jadi yang dikirim
 * hanya field yang benar-benar dipakai kartu dan filter. Deskripsi lengkap,
 * semua URL foto, dan varian TIDAK ikut — itu cuma perlu di halaman detail.
 */
export type ProductListItem = {
  slug: string;
  name: string;
  price: number;
  hasPriceRange: boolean;
  stock: number;
  inStock: boolean;
  /** Foto pertama saja; kartu tidak memakai sisanya. */
  image: string | null;
  categoryName: string;
  categorySlug: string;
  /** Teks pencarian siap pakai: nama, SKU, kategori, dan kata kunci deskripsi. */
  search: string;
};

export type CategorySummary = {
  slug: string;
  name: string;
  count: number;
};

export type Catalog = {
  generatedAt: string;
  source: { files: string[]; rows: number };
  categories: CategorySummary[];
  products: Product[];
};

/** Satu baris di keranjang. Data produk disalin supaya keranjang tetap utuh
 *  walau katalog di-import ulang dan produknya hilang. */
export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  variantId: string | null;
  variantName: string | null;
  price: number;
  image: string | null;
  stock: number;
  qty: number;
};
