'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  newProductId,
  readAdminData,
  uniqueSlug,
  writeAdminData,
  type AdminData,
  type ManualProduct,
} from '@/lib/admin-data';
import { login, logout, requireAdmin } from '@/lib/auth';
import { CATALOG_TAG } from '@/lib/catalog';
import { storeUploadedImage } from '@/lib/image';
import { deleteMedia } from '@/lib/store';
import type { ProductOverride } from '@/lib/overrides';
import { shopeeProducts } from '@/lib/shopee-source';

export type ActionState = { error?: string; notice?: string };

/* ------------------------------- masuk ------------------------------- */

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const password = String(form.get('password') ?? '');
  if (!password) return { error: 'Password belum diisi.' };

  const result = await login(password);
  if (!result.ok) return { error: result.error };

  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect('/admin/login');
}

/* ---------------------------- baca formulir ---------------------------- */

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

/** Menerima "1.500.000", "1 500 000", atau "1500000". */
function number(form: FormData, key: string): number | null {
  const raw = text(form, key).replace(/[^\d]/g, '');
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

const checked = (form: FormData, key: string) => form.get(key) === 'on' || form.get(key) === 'true';

async function uploadAll(form: FormData): Promise<{ urls: string[]; errors: string[]; notes: string[] }> {
  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  const urls: string[] = [];
  const errors: string[] = [];
  const notes: string[] = [];

  for (const file of files) {
    const result = await storeUploadedImage(file);
    if (result.ok) {
      urls.push(result.url);
      notes.push(`${file.name}: ${result.note}`);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  }
  return { urls, errors, notes };
}

/* ------------------------- simpan / ubah produk ------------------------- */

export async function saveProductAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const name = text(form, 'name');
  if (!name) return { error: 'Nama produk wajib diisi.' };

  const price = number(form, 'price');
  if (price === null) return { error: 'Harga wajib diisi (angka).' };

  const data = await readAdminData();
  const id = text(form, 'id');

  const keptImages = form.getAll('keepImage').map(String).filter(Boolean);
  const { urls: newImages, errors, notes } = await uploadAll(form);
  const images = [...keptImages, ...newImages];

  const stock = number(form, 'stock') ?? 0;
  const description = text(form, 'description');
  const sku = text(form, 'sku');
  const weightGram = number(form, 'weightGram');
  const shipDays = number(form, 'shipDays');
  const featured = checked(form, 'featured');
  const hidden = checked(form, 'hidden');

  const existingManual = id ? data.products.find((p) => p.id === id) : undefined;
  const shopeeMatch = id && !existingManual ? shopeeProducts.find((p) => p.id === id) : undefined;
  const isShopee = Boolean(shopeeMatch);

  // foto yang tadinya terpasang; yang tidak dicentang lagi akan dibersihkan
  const previousImages = existingManual
    ? existingManual.images
    : shopeeMatch
      ? (data.overrides[id]?.images ?? shopeeMatch.images)
      : [];

  if (isShopee) {
    // Produk hasil import tidak diubah langsung — perubahan disimpan sebagai
    // override, jadi `npm run import` berikutnya tidak menimpa editanmu.
    const override: ProductOverride = {
      name,
      sku,
      description,
      price,
      stock,
      images,
      weightGram,
      shipDays,
      hidden,
      featured,
    };
    const categorySlug = text(form, 'categorySlug');
    if (categorySlug) override.categorySlug = categorySlug;

    data.overrides = { ...data.overrides, [id]: override };
  } else if (existingManual) {
    const next: ManualProduct = {
      ...existingManual,
      name,
      sku,
      description,
      price,
      stock,
      categoryName: text(form, 'categoryName') || existingManual.categoryName,
      images,
      weightGram,
      shipDays,
      hidden,
      featured,
      updatedAt: new Date().toISOString(),
    };
    data.products = data.products.map((p) => (p.id === existingManual.id ? next : p));
  } else {
    const taken = [...data.products.map((p) => p.slug), ...shopeeProducts.map((p) => p.slug)];
    const now = new Date().toISOString();
    data.products = [
      {
        id: newProductId(),
        slug: uniqueSlug(name, taken),
        name,
        sku,
        description,
        price,
        stock,
        categoryName: text(form, 'categoryName') || 'Lain-lain',
        images,
        weightGram,
        shipDays,
        hidden,
        featured,
        createdAt: now,
        updatedAt: now,
      },
      ...data.products,
    ];
  }

  await save(data);
  await pruneImages(data, previousImages.filter((url) => !images.includes(url)));

  const summary = [
    notes.length ? `${notes.length} foto diunggah (${notes.join('; ')})` : null,
    errors.length ? `Gagal: ${errors.join('; ')}` : null,
  ]
    .filter(Boolean)
    .join(' — ');

  if (errors.length) return { error: summary };
  redirect(`/admin?pesan=${encodeURIComponent(`"${name}" tersimpan.${summary ? ' ' + summary : ''}`)}`);
}

/* ------------------------------ hapus dsb ------------------------------ */

export async function deleteProductAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = text(form, 'id');

  const data = await readAdminData();
  const target = data.products.find((p) => p.id === id);
  if (!target) {
    redirect('/admin?pesan=' + encodeURIComponent('Produk tidak ditemukan atau berasal dari Shopee (tidak bisa dihapus, sembunyikan saja).'));
  }

  data.products = data.products.filter((p) => p.id !== id);
  await save(data);
  await pruneImages(data, target.images);
  redirect('/admin?pesan=' + encodeURIComponent(`"${target.name}" dihapus.`));
}

export async function toggleHiddenAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = text(form, 'id');
  const data = await readAdminData();

  const manual = data.products.find((p) => p.id === id);
  if (manual) {
    data.products = data.products.map((p) => (p.id === id ? { ...p, hidden: !p.hidden } : p));
  } else {
    const current = data.overrides[id] ?? {};
    data.overrides = { ...data.overrides, [id]: { ...current, hidden: !current.hidden } };
  }

  await save(data);
  redirect('/admin');
}

/** Buang override supaya produk kembali ke data asli dari Shopee. */
export async function resetOverrideAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = text(form, 'id');
  const data = await readAdminData();

  const { [id]: removed, ...rest } = data.overrides;
  if (!removed) redirect('/admin');

  data.overrides = rest;
  await save(data);
  redirect('/admin?pesan=' + encodeURIComponent('Produk dikembalikan ke data asli Shopee.'));
}

/* ------------------------------- bersama ------------------------------- */

const MEDIA_PREFIX = '/media/';

/**
 * Buang foto unggahan yang sudah tidak dipakai produk mana pun.
 *
 * Tanpa ini setiap foto yang diganti atau produk yang dihapus meninggalkan
 * file yatim di penyimpanan — tidak terlihat, tapi terus menumpuk.
 * Hanya menyentuh foto hasil unggahan; foto dari import Shopee (/produk/...)
 * tidak pernah dihapus dari sini.
 */
async function pruneImages(data: AdminData, candidates: string[]): Promise<void> {
  const used = new Set<string>();
  for (const product of data.products) for (const url of product.images) used.add(url);
  for (const override of Object.values(data.overrides)) {
    for (const url of override.images ?? []) used.add(url);
  }

  for (const url of new Set(candidates)) {
    if (!url.startsWith(MEDIA_PREFIX) || used.has(url)) continue;
    await deleteMedia(url.slice(MEDIA_PREFIX.length));
  }
}

async function save(data: AdminData): Promise<void> {
  await writeAdminData(data);
  // Halaman toko memakai cache bertag; tanpa ini perubahan tidak muncul.
  // updateTag (bukan revalidateTag) supaya hasil simpan langsung terlihat
  // di request yang sama — Next 16 menyebutnya read-your-own-writes.
  updateTag(CATALOG_TAG);
}
