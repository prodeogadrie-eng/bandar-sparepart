import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readAdminData } from '@/lib/admin-data';
import { getCatalog } from '@/lib/catalog';
import { shopeeProducts } from '@/lib/shopee-source';
import { ProductForm, type FormValues } from '../ProductForm';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // "baru" ditangani route lain; hindari bentrok kalau ada yang mengetik manual
  if (id === 'baru') notFound();

  const [admin, { categories }] = await Promise.all([readAdminData(), getCatalog()]);

  const manual = admin.products.find((p) => p.id === id);
  const shopee = manual ? undefined : shopeeProducts.find((p) => p.id === id);
  if (!manual && !shopee) notFound();

  let values: FormValues;
  let source: 'sendiri' | 'shopee';

  if (manual) {
    source = 'sendiri';
    values = {
      id: manual.id,
      name: manual.name,
      sku: manual.sku,
      categoryName: manual.categoryName,
      categorySlug: '',
      price: manual.price,
      stock: manual.stock,
      description: manual.description,
      weightGram: manual.weightGram ?? '',
      shipDays: manual.shipDays ?? '',
      images: manual.images,
      featured: manual.featured,
      hidden: manual.hidden,
    };
  } else {
    const product = shopee!;
    // nilai yang sudah pernah diedit ditampilkan, bukan aslinya
    const override = admin.overrides[product.id] ?? {};
    source = 'shopee';
    values = {
      id: product.id,
      name: override.name ?? product.name,
      sku: override.sku ?? product.sku,
      categoryName: product.category.name,
      categorySlug: override.categorySlug ?? '',
      price: override.price ?? product.price,
      stock: override.stock ?? product.stock,
      description: override.description ?? product.description,
      weightGram: override.weightGram ?? product.weightGram ?? '',
      shipDays: override.shipDays ?? product.shipDays ?? '',
      images: override.images ?? product.images,
      featured: override.featured ?? false,
      hidden: override.hidden ?? false,
    };
  }

  return (
    <>
      <nav className="text-xs text-muted">
        <Link href="/admin" className="hover:text-brand">
          Produk
        </Link>{' '}
        / Edit
      </nav>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{values.name}</h1>
        <span className="rounded-full bg-line/70 px-2.5 py-1 text-[11px] font-semibold text-muted">
          {source === 'sendiri' ? 'Produk sendiri' : 'Dari Shopee'}
        </span>
      </div>

      {source === 'shopee' && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Produk ini berasal dari export Shopee. Perubahanmu disimpan sebagai lapisan terpisah, jadi{' '}
          <code className="font-mono text-xs">npm run import</code> berikutnya tidak akan
          menimpanya. Tombol &ldquo;Reset&rdquo; di daftar produk membuang editan ini.
        </p>
      )}

      <div className="mt-6">
        <ProductForm
          values={values}
          source={source}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        />
      </div>
    </>
  );
}
