import 'server-only';

import { readText, writeText } from './store';
import type { ProductOverride } from './overrides';
export { slugify, uniqueSlug } from './slug';

/** Produk yang kamu tambahkan sendiri lewat halaman admin (bukan dari Shopee). */
export type ManualProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  categoryName: string;
  images: string[];
  weightGram: number | null;
  shipDays: number | null;
  hidden: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminData = {
  version: 1;
  updatedAt: string | null;
  /** Produk buatan sendiri. */
  products: ManualProduct[];
  /** Perubahan atas produk hasil import Shopee, dikunci pakai slug atau Kode Produk. */
  overrides: Record<string, ProductOverride>;
};

const KEY = 'catalog.json';

export const EMPTY_ADMIN_DATA: AdminData = {
  version: 1,
  updatedAt: null,
  products: [],
  overrides: {},
};

export async function readAdminData(): Promise<AdminData> {
  const raw = await readText(KEY);
  if (!raw) return EMPTY_ADMIN_DATA;

  try {
    const parsed = JSON.parse(raw) as Partial<AdminData>;
    return {
      version: 1,
      updatedAt: parsed.updatedAt ?? null,
      products: Array.isArray(parsed.products) ? parsed.products : [],
      overrides:
        parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
    };
  } catch {
    // Jangan sampai data rusak menjatuhkan seluruh situs.
    console.error('[admin-data] catalog.json tidak bisa dibaca, memakai data kosong.');
    return EMPTY_ADMIN_DATA;
  }
}

export async function writeAdminData(data: AdminData): Promise<void> {
  const next: AdminData = { ...data, version: 1, updatedAt: new Date().toISOString() };
  await writeText(KEY, JSON.stringify(next, null, 2));
}

/* --------------------------- bantuan bentuk --------------------------- */

export function newProductId(): string {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
