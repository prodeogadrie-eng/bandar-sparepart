'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { buildOrderMessage, checkoutLink, type CheckoutDetails } from '@/lib/whatsapp';
import { useCart } from './CartProvider';
import { WhatsAppIcon } from './icons';

const STORAGE_KEY = 'toko-checkout-v1';

const EMPTY: CheckoutDetails = { name: '', phone: '', address: '', note: '' };

export function CheckoutView() {
  const { items, total, count, ready, clear } = useCart();
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY);
  const [sent, setSent] = useState(false);

  // Data pembeli diingat di perangkat sendiri supaya tidak perlu ketik ulang.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setDetails({ ...EMPTY, ...(JSON.parse(stored) as CheckoutDetails) });
    } catch {
      // abaikan: form tetap bisa diisi manual
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    } catch {
      // penyimpanan diblokir; tidak masalah
    }
  }, [details]);

  const message = useMemo(() => buildOrderMessage(items, details), [items, details]);
  const href = useMemo(() => checkoutLink(items, details), [items, details]);

  const canSubmit = Boolean(details.name?.trim() && details.phone?.trim() && items.length);

  const update = (key: keyof CheckoutDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDetails((prev) => ({ ...prev, [key]: e.target.value }));

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-line/60" />;
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <p className="text-sm font-semibold">Belum ada yang bisa di-checkout</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Tambahkan produk ke keranjang dulu, ya.
        </p>
        <Link
          href="/produk"
          className="mt-6 inline-flex rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Lihat katalog
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-bold">Data pemesan</h2>
          <p className="mt-1 text-xs text-muted">
            Dipakai untuk mengisi pesan WhatsApp otomatis. Tidak ada data yang dikirim ke server.
          </p>

          <div className="mt-5 space-y-4">
            <Field
              label="Nama"
              required
              placeholder="Nama lengkap"
              value={details.name ?? ''}
              onChange={update('name')}
              autoComplete="name"
            />
            <Field
              label="No. HP / WhatsApp"
              required
              type="tel"
              inputMode="tel"
              placeholder="08xxxxxxxxxx"
              value={details.phone ?? ''}
              onChange={update('phone')}
              autoComplete="tel"
            />
            <Field
              label="Alamat pengiriman"
              textarea
              placeholder="Nama jalan, kota, kode pos (boleh dilengkapi nanti lewat chat)"
              value={details.address ?? ''}
              onChange={update('address')}
              autoComplete="street-address"
            />
            <Field
              label="Catatan"
              placeholder="Tipe unit, ekspedisi favorit, dll."
              value={details.note ?? ''}
              onChange={update('note')}
            />
          </div>
        </div>

        <details className="group rounded-2xl border border-line bg-surface p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold">
            Lihat pesan yang akan dikirim
            <span className="ml-2 font-normal text-muted group-open:hidden">(klik untuk buka)</span>
          </summary>
          <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-page p-4 text-xs leading-relaxed text-muted">
            {message}
          </pre>
        </details>
      </form>

      <aside className="sticky bottom-0 z-30 -mx-4 border-t border-line bg-surface p-4 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-2xl lg:border lg:p-5">
        <h2 className="hidden text-base font-bold lg:block">Ringkasan</h2>

        <ul className="hidden space-y-3 pt-4 text-sm lg:block">
          {items.map((item) => (
            <li key={item.key} className="flex justify-between gap-4">
              <span className="min-w-0">
                <span className="line-clamp-2 font-medium">{item.name}</span>
                <span className="text-xs text-muted">
                  {item.variantName ? `${item.variantName} · ` : ''}
                  {item.qty} x {formatPrice(item.price)}
                </span>
              </span>
              <span className="shrink-0 font-semibold">{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-4 lg:mt-4 lg:border-t lg:border-line lg:pt-4">
          <span className="text-sm text-muted lg:font-semibold lg:text-ink">Total ({count} item)</span>
          <span className="text-xl font-extrabold tracking-tight text-brand">{formatPrice(total)}</span>
        </div>

        <a
          href={canSubmit ? href : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!canSubmit}
          onClick={(e) => {
            if (!canSubmit) {
              e.preventDefault();
              return;
            }
            setSent(true);
          }}
          className={`mt-3 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-opacity ${
            canSubmit ? 'bg-wa hover:opacity-90' : 'pointer-events-none bg-muted/50'
          }`}
        >
          <WhatsAppIcon className="h-4 w-4" />
          Kirim pesanan via WhatsApp
        </a>

        {!canSubmit && (
          <p className="mt-2 text-center text-xs text-muted">Isi nama dan nomor HP dulu.</p>
        )}

        {sent && (
          <div className="mt-3 rounded-xl bg-brand-soft p-3 text-xs leading-relaxed text-brand-dark">
            Pesanan sudah dibuka di WhatsApp. Setelah terkirim,{' '}
            <button type="button" onClick={clear} className="font-semibold underline underline-offset-2">
              kosongkan keranjang
            </button>
            .
          </div>
        )}

        <p className="mt-3 hidden text-center text-xs text-muted lg:block">
          <Link href="/keranjang" className="hover:text-ink">
            Ubah keranjang
          </Link>
        </p>
      </aside>
    </div>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  textarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function Field({ label, required, textarea, ...props }: FieldProps) {
  const className =
    'mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand';

  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      {textarea ? (
        <textarea rows={3} className={className} {...props} />
      ) : (
        <input className={className} {...props} />
      )}
    </label>
  );
}
