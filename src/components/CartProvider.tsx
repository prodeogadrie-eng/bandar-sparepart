'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, Product, Variant } from '@/lib/types';
import { cartCount, cartTotal } from '@/lib/whatsapp';

const STORAGE_KEY = 'toko-cart-v1';

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  /** false sampai localStorage selesai dibaca — dipakai untuk cegah mismatch SSR. */
  ready: boolean;
  add: (product: Product, variant: Variant | null, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const itemKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? 'default'}`;

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.key === 'string' &&
    typeof v.productId === 'string' &&
    typeof v.slug === 'string' &&
    typeof v.name === 'string' &&
    typeof v.price === 'number' &&
    typeof v.qty === 'number' &&
    v.qty > 0
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed.filter(isCartItem));
      }
    } catch {
      // localStorage tidak tersedia / isinya rusak: mulai dari keranjang kosong.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // penyimpanan penuh atau diblokir; keranjang tetap jalan selama sesi ini.
    }
  }, [items, ready]);

  const add = useCallback((product: Product, variant: Variant | null, qty = 1) => {
    const key = itemKey(product.id, variant?.id ?? null);
    const stock = variant ? variant.stock : product.stock;
    const price = variant && variant.price > 0 ? variant.price : product.price;

    setItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        const nextQty = stock > 0 ? Math.min(existing.qty + qty, stock) : existing.qty + qty;
        return prev.map((item) => (item.key === key ? { ...item, qty: nextQty, price, stock } : item));
      }
      const next: CartItem = {
        key,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        price,
        image: variant?.image ?? product.images[0] ?? null,
        stock,
        qty: stock > 0 ? Math.min(qty, stock) : qty,
      };
      return [...prev, next];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.key !== key) return [item];
        const max = item.stock > 0 ? item.stock : 99;
        const next = Math.min(Math.max(1, Math.round(qty)), max);
        return Number.isFinite(next) ? [{ ...item, qty: next }] : [item];
      }),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      total: cartTotal(items),
      ready,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, ready, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart harus dipakai di dalam <CartProvider>');
  return ctx;
}
