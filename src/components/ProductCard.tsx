import Link from 'next/link';
import siteConfig from '@config';
import { formatPrice } from '@/lib/format';
import type { ProductListItem } from '@/lib/types';
import { SafeImage } from './SafeImage';

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductListItem;
  priority?: boolean;
}) {
  const lowStock = product.inStock && product.stock <= 3;

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <SafeImage
          src={product.image}
          alt={product.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />
        {!product.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">
            Stok habis
          </span>
        )}
        {lowStock && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-ink">
            Sisa {product.stock}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-line p-3.5 sm:p-4">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">
          {product.categoryName}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-brand">
          {product.name}
        </h3>
        <div className="mt-auto pt-1">
          <p className="text-base font-bold text-brand">
            {formatPrice(product.price)}
            {product.hasPriceRange && <span className="text-xs font-medium text-muted"> +</span>}
          </p>
          {siteConfig.catalog.priceNote && (
            <p className="mt-0.5 text-[11px] text-muted">{siteConfig.catalog.priceNote}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
