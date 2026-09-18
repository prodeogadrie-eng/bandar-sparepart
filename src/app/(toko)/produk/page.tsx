import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogClient } from '@/components/CatalogClient';
import { getCatalog } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Katalog Produk',
  description: 'Cari sparepart berdasarkan nama produk, nomor part, atau kategori.',
};

export default async function CatalogPage() {
  const { list, categories, products } = await getCatalog();

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Katalog produk</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {products.length} produk dalam {categories.length} kategori. Cari langsung pakai nomor part
          (contoh: <span className="font-medium text-ink">DZ9112230166</span>) untuk hasil paling cepat.
        </p>
      </header>

      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogClient products={list} categories={categories} />
      </Suspense>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 rounded-xl bg-line/60" />
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-full bg-line/60" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-line/60" />
        ))}
      </div>
    </div>
  );
}
