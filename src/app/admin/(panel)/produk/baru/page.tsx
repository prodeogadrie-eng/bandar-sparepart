import Link from 'next/link';
import { getCatalog } from '@/lib/catalog';
import { EMPTY_VALUES, ProductForm } from '../ProductForm';

export default async function NewProductPage() {
  const { categories } = await getCatalog();

  return (
    <>
      <nav className="text-xs text-muted">
        <Link href="/admin" className="hover:text-brand">
          Produk
        </Link>{' '}
        / Tambah
      </nav>

      <h1 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">Tambah produk</h1>
      <p className="mt-1 text-sm text-muted">
        Produk ini milikmu sendiri — tidak ikut tertimpa saat import ulang dari Shopee.
      </p>

      <div className="mt-6">
        <ProductForm
          values={EMPTY_VALUES}
          source="baru"
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        />
      </div>
    </>
  );
}
