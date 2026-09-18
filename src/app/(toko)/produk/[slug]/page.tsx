import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import siteConfig from '@config';
import { Description } from '@/components/Description';
import { ProductCard } from '@/components/ProductCard';
import { ProductGallery } from '@/components/ProductGallery';
import { PurchasePanel } from '@/components/PurchasePanel';
import { formatWeight } from '@/lib/format';
import { getCatalog, getProductBySlug, getRelatedProducts } from '@/lib/catalog';
import { productInquiryLink } from '@/lib/whatsapp';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Produk tidak ditemukan' };

  return {
    title: product.name,
    description: product.excerpt || `${product.name} — ${siteConfig.brand.name}`,
    openGraph: {
      title: product.name,
      description: product.excerpt,
      images: product.images.slice(0, 1),
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const weight = formatWeight(product.weightGram);
  const { length, width, height } = product.dimensions;
  const dimensions = length && width && height ? `${length} × ${width} × ${height} cm` : null;

  const specs = [
    product.sku ? { label: 'SKU', value: product.sku } : null,
    { label: 'Kategori', value: product.category.name },
    weight ? { label: 'Berat', value: weight } : null,
    dimensions ? { label: 'Dimensi', value: dimensions } : null,
    product.shipDays ? { label: 'Dikirim dalam', value: `${product.shipDays} hari kerja` } : null,
    { label: 'Kode produk', value: product.id },
  ].filter((spec): spec is { label: string; value: string } => spec !== null);

  return (
    <div className="container-page py-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-brand">
          Beranda
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/produk" className="hover:text-brand">
          Katalog
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/produk?kategori=${product.category.slug}`} className="hover:text-brand">
          {product.category.name}
        </Link>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
              {product.category.name}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                product.inStock ? 'bg-brand-soft text-brand-dark' : 'bg-line/70 text-muted'
              }`}
            >
              {product.inStock ? `Ready stock (${product.stock})` : 'Stok habis'}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-6">
            <PurchasePanel product={product} />
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-line bg-surface p-5">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt className="text-xs text-muted">{spec.label}</dt>
                <dd className="mt-0.5 break-words text-sm font-medium">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-8">
            <h2 className="text-base font-bold tracking-tight">Deskripsi produk</h2>
            <div className="mt-3">
              <Description text={product.description} />
            </div>
          </section>

          <div className="mt-8 rounded-2xl border border-line bg-brand-soft/60 p-5">
            <p className="text-sm font-semibold">Belum yakin part-nya cocok?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Kirim nomor part atau tipe unitnya, admin bantu cek kecocokan sebelum kamu bayar.
            </p>
            <a
              href={productInquiryLink(product.name, product.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand/50"
            >
              Tanya produk ini
            </a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">Produk lainnya</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
