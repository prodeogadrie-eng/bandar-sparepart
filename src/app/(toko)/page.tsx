import Link from 'next/link';
import siteConfig from '@config';
import { ProductCard } from '@/components/ProductCard';
import { SafeImage } from '@/components/SafeImage';
import { getCatalog } from '@/lib/catalog';
import { generalChatLink } from '@/lib/whatsapp';

export default async function HomePage() {
  const { featured, categories, products } = await getCatalog();
  const { home, brand } = siteConfig;

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-gradient-to-b from-brand-soft to-page">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {home.heroEyebrow}
            </span>

            <h1 className="mt-5 text-balance text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              {home.heroTitle}
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
              {home.heroSubtitle}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/produk"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Lihat katalog
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href={generalChatLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-3.5 text-sm font-semibold transition-colors hover:border-brand/40"
              >
                Tanya stok dulu
              </a>
            </div>

            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
              {[
                { label: 'Produk aktif', value: products.length },
                { label: 'Kategori', value: categories.length },
                { label: 'Balas chat', value: '< 1 jam' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs text-muted">{stat.label}</dt>
                  <dd className="text-xl font-bold tracking-tight">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Kolase 4 produk unggulan */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {featured.slice(0, 4).map((product, i) => (
              <Link
                key={product.slug}
                href={`/produk/${product.slug}`}
                className={`group relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface ${
                  i % 3 === 0 ? 'sm:translate-y-3' : ''
                }`}
              >
                <SafeImage
                  src={product.image}
                  alt={product.name}
                  sizes="(min-width: 1024px) 20vw, 45vw"
                  priority={i < 2}
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Keunggulan */}
      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {home.benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kategori */}
      <section className="container-page pb-4">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">Belanja per kategori</h2>
        <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2 no-scrollbar sm:flex-wrap sm:overflow-visible">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/produk?kategori=${category.slug}`}
              className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-brand/50 hover:text-brand"
            >
              {category.name}
              <span className="ml-1.5 text-xs text-muted">{category.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Produk unggulan */}
      <section className="container-page py-10 sm:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">Produk unggulan</h2>
            <p className="mt-1 text-sm text-muted">Paling sering ditanyakan pembeli {brand.name}.</p>
          </div>
          <Link href="/produk" className="shrink-0 text-sm font-semibold text-brand hover:text-brand-dark">
            Lihat semua
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {featured.map((product, i) => (
            <ProductCard key={product.slug} product={product} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-4">
        <div className="rounded-3xl border border-line bg-surface p-7 text-center sm:p-12">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Tidak menemukan part yang dicari?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Kirim nomor part atau foto komponennya lewat WhatsApp. Kami bantu carikan, termasuk part yang
            belum tayang di katalog.
          </p>
          <a
            href={generalChatLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-wa px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Chat admin sekarang
          </a>
        </div>
      </section>
    </>
  );
}
