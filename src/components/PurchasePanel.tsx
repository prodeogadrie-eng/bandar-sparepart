'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import siteConfig from '@config';
import { formatPrice } from '@/lib/format';
import type { CartItem, Product, Variant } from '@/lib/types';
import { checkoutLink } from '@/lib/whatsapp';
import { useCart } from './CartProvider';
import { WhatsAppIcon } from './icons';

export function PurchasePanel({ product }: { product: Product }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState<string | null>(product.variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant: Variant | null = product.variants.find((v) => v.id === variantId) ?? null;
  const price = variant && variant.price > 0 ? variant.price : product.price;
  const stock = variant ? variant.stock : product.stock;
  const available = stock > 0;
  const maxQty = available ? stock : 1;

  const directOrder: CartItem = useMemo(
    () => ({
      key: `${product.id}:${variant?.id ?? 'default'}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      price,
      image: variant?.image ?? product.images[0] ?? null,
      stock,
      qty,
    }),
    [product, variant, price, stock, qty],
  );

  const handleAdd = () => {
    add(product, variant, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-3xl font-extrabold tracking-tight text-brand">{formatPrice(price)}</p>
        {siteConfig.catalog.priceNote && (
          <p className="mt-1 text-xs text-muted">{siteConfig.catalog.priceNote}</p>
        )}
      </div>

      {product.variants.length > 0 && (
        <div>
          <p className="text-sm font-semibold">
            Pilih varian
            {variant && <span className="ml-2 font-normal text-muted">{variant.name}</span>}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.variants.map((option) => {
              const selected = option.id === variantId;
              const soldOut = option.stock <= 0;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    setVariantId(option.id);
                    setQty(1);
                  }}
                  aria-pressed={selected}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    selected
                      ? 'border-brand bg-brand-soft text-brand-dark'
                      : 'border-line bg-surface hover:border-brand/50'
                  } ${soldOut ? 'cursor-not-allowed text-muted line-through opacity-60' : ''}`}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-xl border border-line bg-surface">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Kurangi jumlah"
            className="grid h-11 w-11 place-items-center rounded-l-xl text-lg transition-colors hover:bg-page disabled:opacity-40"
          >
            &minus;
          </button>
          <span aria-live="polite" className="w-10 text-center text-sm font-semibold">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            aria-label="Tambah jumlah"
            className="grid h-11 w-11 place-items-center rounded-r-xl text-lg transition-colors hover:bg-page disabled:opacity-40"
          >
            +
          </button>
        </div>

        <p className="text-sm text-muted">
          {available ? (
            <>
              Stok tersedia <span className="font-semibold text-ink">{stock}</span>
            </>
          ) : (
            <span className="font-semibold text-ink">Stok habis — bisa indent</span>
          )}
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand bg-surface px-5 py-3.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft"
        >
          {added ? 'Masuk keranjang ✓' : '+ Keranjang'}
        </button>

        <a
          href={checkoutLink([directOrder])}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-wa px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <WhatsAppIcon />
          Pesan via WhatsApp
        </a>
      </div>

      {added && (
        <p className="text-sm text-muted">
          Sudah ditambahkan.{' '}
          <Link href="/keranjang" className="font-semibold text-brand hover:text-brand-dark">
            Lihat keranjang
          </Link>
        </p>
      )}
    </div>
  );
}

