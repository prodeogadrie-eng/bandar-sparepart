'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { searchProducts } from '@/lib/search';
import type { CategorySummary, ProductListItem } from '@/lib/types';

type SortKey = 'terlaris' | 'termurah' | 'termahal' | 'nama';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'terlaris', label: 'Paling relevan' },
  { key: 'termurah', label: 'Harga terendah' },
  { key: 'termahal', label: 'Harga tertinggi' },
  { key: 'nama', label: 'Nama A-Z' },
];

export function CatalogClient({
  products,
  categories,
}: {
  products: ProductListItem[];
  categories: CategorySummary[];
}) {
  const params = useSearchParams();

  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [category, setCategory] = useState(() => params.get('kategori') ?? 'semua');
  const [sort, setSort] = useState<SortKey>('terlaris');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Ikut berubah kalau user menekan tombol back/forward atau klik link kategori.
  useEffect(() => {
    setQuery(params.get('q') ?? '');
    setCategory(params.get('kategori') ?? 'semua');
  }, [params]);

  // Simpan filter di URL supaya bisa di-share, tanpa memicu navigasi ulang.
  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set('q', query.trim());
    if (category !== 'semua') next.set('kategori', category);
    const search = next.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ''}`;
    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, '', url);
    }
  }, [query, category]);

  const results = useMemo(() => {
    let list = products;
    if (category !== 'semua') list = list.filter((p) => p.categorySlug === category);
    if (inStockOnly) list = list.filter((p) => p.inStock);
    list = searchProducts(list, query);

    const sorted = [...list];
    if (sort === 'termurah') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'termahal') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'nama') sorted.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    return sorted;
  }, [products, category, inStockOnly, query, sort]);

  const chips = [{ slug: 'semua', name: 'Semua', count: products.length }, ...categories];
  const hasFilter = query.trim() !== '' || category !== 'semua' || inStockOnly;

  const reset = () => {
    setQuery('');
    setCategory('semua');
    setInStockOnly(false);
  };

  return (
    <>
      {/* Pencarian */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama produk atau nomor part..."
            aria-label="Cari produk"
            className="w-full rounded-xl border border-line bg-surface py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </div>
      </div>

      {/* Filter kategori */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:flex-wrap lg:overflow-visible">
        {chips.map((chip) => {
          const active = category === chip.slug;
          return (
            <button
              key={chip.slug}
              type="button"
              onClick={() => setCategory(chip.slug)}
              aria-pressed={active}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-brand bg-brand text-white'
                  : 'border-line bg-surface text-ink hover:border-brand/50'
              }`}
            >
              {chip.name}
              <span className={`ml-1.5 text-xs ${active ? 'text-white/75' : 'text-muted'}`}>{chip.count}</span>
            </button>
          );
        })}
      </div>

      {/* Baris kontrol */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{results.length}</span> produk
          {hasFilter && (
            <button type="button" onClick={reset} className="ml-3 font-medium text-brand hover:text-brand-dark">
              Reset filter
            </button>
          )}
        </p>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            Ready stock
          </label>

          <label className="sr-only" htmlFor="sort">
            Urutkan
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand"
          >
            {SORTS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hasil */}
      {results.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {results.map((product, i) => (
            <ProductCard key={product.slug} product={product} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="text-sm font-semibold">Produk tidak ditemukan</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Coba kata kunci lain atau hapus filternya. Kalau part-nya memang belum tayang, tanyakan langsung
            ke admin lewat WhatsApp.
          </p>
          {hasFilter && (
            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold transition-colors hover:border-brand/50"
            >
              Tampilkan semua produk
            </button>
          )}
        </div>
      )}
    </>
  );
}
