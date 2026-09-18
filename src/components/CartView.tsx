'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { useCart } from './CartProvider';
import { SafeImage } from './SafeImage';

export function CartView() {
  const { items, total, count, ready, setQty, remove, clear } = useCart();

  if (!ready) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-line/60" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
            <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.55L20 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="20" r="1.3" />
            <circle cx="17" cy="20" r="1.3" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-semibold">Keranjang masih kosong</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Tambahkan produk dari katalog, lalu checkout lewat WhatsApp.
        </p>
        <Link
          href="/produk"
          className="mt-6 inline-flex rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Mulai belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 rounded-2xl border border-line bg-surface p-3 sm:gap-4 sm:p-4">
            <Link
              href={`/produk/${item.slug}`}
              className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-white sm:w-24"
            >
              <SafeImage src={item.image} alt={item.name} sizes="96px" className="object-contain p-1.5" />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Link href={`/produk/${item.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-brand">
                    {item.name}
                  </Link>
                  {item.variantName && <p className="mt-0.5 text-xs text-muted">Varian: {item.variantName}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.key)}
                  aria-label={`Hapus ${item.name} dari keranjang`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-page hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex items-center rounded-xl border border-line">
                  <button
                    type="button"
                    onClick={() => setQty(item.key, item.qty - 1)}
                    disabled={item.qty <= 1}
                    aria-label="Kurangi jumlah"
                    className="grid h-9 w-9 place-items-center rounded-l-xl transition-colors hover:bg-page disabled:opacity-40"
                  >
                    &minus;
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.key, item.qty + 1)}
                    disabled={item.stock > 0 && item.qty >= item.stock}
                    aria-label="Tambah jumlah"
                    className="grid h-9 w-9 place-items-center rounded-r-xl transition-colors hover:bg-page disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-brand">{formatPrice(item.price * item.qty)}</p>
                  {item.qty > 1 && (
                    <p className="text-[11px] text-muted">@ {formatPrice(item.price)}</p>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="sticky bottom-0 z-30 -mx-4 border-t border-line bg-surface p-4 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-2xl lg:border lg:p-5">
        <h2 className="hidden text-base font-bold lg:block">Ringkasan pesanan</h2>

        <dl className="hidden space-y-2.5 pt-4 text-sm lg:block">
          <div className="flex justify-between">
            <dt className="text-muted">Jumlah barang</dt>
            <dd className="font-medium">{count} item</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Ongkos kirim</dt>
            <dd className="font-medium">Dihitung via chat</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between gap-4 lg:mt-4 lg:border-t lg:border-line lg:pt-4">
          <span className="text-sm text-muted lg:font-semibold lg:text-ink">Total</span>
          <span className="text-xl font-extrabold tracking-tight text-brand">{formatPrice(total)}</span>
        </div>

        <Link
          href="/checkout"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Lanjut ke checkout
        </Link>

        <div className="mt-3 hidden justify-between text-xs lg:flex">
          <Link href="/produk" className="font-medium text-muted hover:text-ink">
            Tambah produk lain
          </Link>
          <button type="button" onClick={clear} className="font-medium text-muted hover:text-ink">
            Kosongkan keranjang
          </button>
        </div>
      </aside>
    </div>
  );
}
