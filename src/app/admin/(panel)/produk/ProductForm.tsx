'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState } from 'react';
import { saveProductAction, type ActionState } from '../../actions';

export type FormValues = {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  categorySlug: string;
  price: number | '';
  stock: number | '';
  description: string;
  weightGram: number | '';
  shipDays: number | '';
  images: string[];
  featured: boolean;
  hidden: boolean;
};

export const EMPTY_VALUES: FormValues = {
  id: '',
  name: '',
  sku: '',
  categoryName: '',
  categorySlug: '',
  price: '',
  stock: '',
  description: '',
  weightGram: '',
  shipDays: '',
  images: [],
  featured: false,
  hidden: false,
};

const initial: ActionState = {};

const field =
  'mt-1.5 w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand';
const label = 'block text-sm font-medium';
const hint = 'mt-1 text-xs text-muted';

export function ProductForm({
  values,
  source,
  categories,
}: {
  values: FormValues;
  source: 'baru' | 'sendiri' | 'shopee';
  categories: { slug: string; name: string }[];
}) {
  const [state, submit, pending] = useActionState(saveProductAction, initial);
  const isShopee = source === 'shopee';

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <input type="hidden" name="id" value={values.id} />

      {/* ---------------- kolom utama ---------------- */}
      <div className="grid gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div>
          <label className={label} htmlFor="name">
            Nama produk <span className="text-accent">*</span>
          </label>
          <input id="name" name="name" defaultValue={values.name} required className={field} />
          <p className={hint}>
            Sertakan nomor part kalau ada — itu yang paling sering dicari pembeli.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="price">
              Harga (Rp) <span className="text-accent">*</span>
            </label>
            <input
              id="price"
              name="price"
              inputMode="numeric"
              defaultValue={values.price === '' ? '' : String(values.price)}
              required
              className={field}
            />
            <p className={hint}>Boleh ditulis 1.500.000 atau 1500000.</p>
          </div>

          <div>
            <label className={label} htmlFor="stock">
              Stok
            </label>
            <input
              id="stock"
              name="stock"
              inputMode="numeric"
              defaultValue={values.stock === '' ? '' : String(values.stock)}
              className={field}
            />
            <p className={hint}>0 = tampil sebagai &ldquo;Stok habis&rdquo;.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="sku">
              SKU / nomor part
            </label>
            <input id="sku" name="sku" defaultValue={values.sku} className={field} />
          </div>

          <div>
            {isShopee ? (
              <>
                <label className={label} htmlFor="categorySlug">
                  Kategori
                </label>
                <select
                  id="categorySlug"
                  name="categorySlug"
                  defaultValue={values.categorySlug}
                  className={field}
                >
                  <option value="">(biarkan seperti aslinya)</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className={hint}>Produk Shopee hanya bisa dipindah ke kategori yang sudah ada.</p>
              </>
            ) : (
              <>
                <label className={label} htmlFor="categoryName">
                  Kategori
                </label>
                <input
                  id="categoryName"
                  name="categoryName"
                  defaultValue={values.categoryName}
                  list="daftar-kategori"
                  placeholder="mis. Kopling & Transmisi"
                  className={field}
                />
                <datalist id="daftar-kategori">
                  {categories.map((c) => (
                    <option key={c.slug} value={c.name} />
                  ))}
                </datalist>
                <p className={hint}>Ketik bebas, atau pilih yang sudah ada.</p>
              </>
            )}
          </div>
        </div>

        <div>
          <label className={label} htmlFor="description">
            Deskripsi
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={values.description}
            rows={9}
            className={field}
          />
          <p className={hint}>
            Satu baris kosong memisahkan paragraf. Baris berawalan &ldquo;-&rdquo; jadi poin. Tulis
            merek dan tipe unit yang cocok — kata itu ikut dipakai pencarian.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="weightGram">
              Berat (gram)
            </label>
            <input
              id="weightGram"
              name="weightGram"
              inputMode="numeric"
              defaultValue={values.weightGram === '' ? '' : String(values.weightGram)}
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="shipDays">
              Dikirim dalam (hari kerja)
            </label>
            <input
              id="shipDays"
              name="shipDays"
              inputMode="numeric"
              defaultValue={values.shipDays === '' ? '' : String(values.shipDays)}
              className={field}
            />
          </div>
        </div>
      </div>

      {/* ---------------- kolom samping ---------------- */}
      <div className="grid content-start gap-5">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Foto produk</h2>

          {values.images.length > 0 && (
            <>
              <p className={hint}>Hilangkan tanda centang untuk membuang foto.</p>
              <ul className="mt-3 grid grid-cols-3 gap-2.5">
                {values.images.map((url) => (
                  <li key={url}>
                    <label className="block cursor-pointer">
                      <span className="relative block aspect-square overflow-hidden rounded-lg border border-line bg-white">
                        <Image src={url} alt="" fill sizes="96px" className="object-contain p-1" />
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
                        <input
                          type="checkbox"
                          name="keepImage"
                          value={url}
                          defaultChecked
                          className="h-3.5 w-3.5 accent-[var(--brand)]"
                        />
                        pakai
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-4">
            <label className={label} htmlFor="files">
              Tambah foto
            </label>
            <input
              id="files"
              name="files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-1.5 w-full rounded-xl border border-dashed border-line bg-page px-3.5 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <p className={hint}>
              JPG/PNG/WebP, maksimal 8 MB per foto. Foto besar otomatis dikecilkan ke 1400 px agar
              cepat dibuka pembeli.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Tampilan</h2>
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={values.featured}
              className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            />
            <span>
              Produk unggulan
              <span className="block text-xs text-muted">Tampil di halaman depan.</span>
            </span>
          </label>
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="hidden"
              defaultChecked={values.hidden}
              className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            />
            <span>
              Sembunyikan
              <span className="block text-xs text-muted">Tidak tampil di toko sama sekali.</span>
            </span>
          </label>
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm font-medium text-ink">
            {state.error}
          </p>
        )}

        <div className="flex gap-2.5">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? 'Menyimpan...' : 'Simpan'}
          </button>
          <Link
            href="/admin"
            className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold transition-colors hover:border-brand/50"
          >
            Batal
          </Link>
        </div>

        {pending && (
          <p className="text-xs text-muted">
            Kalau ada foto besar, pengunggahan bisa beberapa detik. Jangan tutup halaman ini.
          </p>
        )}
      </div>
    </form>
  );
}
