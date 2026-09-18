import Link from 'next/link';
import { readAdminData } from '@/lib/admin-data';
import { formatPrice } from '@/lib/format';
import { shopeeProducts } from '@/lib/shopee-source';
import { SafeImage } from '@/components/SafeImage';
import { deleteProductAction, resetOverrideAction, toggleHiddenAction } from '../actions';

type Row = {
  id: string;
  slug: string;
  source: 'sendiri' | 'shopee';
  name: string;
  categoryName: string;
  price: number;
  stock: number;
  image: string | null;
  hidden: boolean;
  featured: boolean;
  edited: boolean;
};

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pesan?: string }>;
}) {
  const { q = '', pesan } = await searchParams;
  const admin = await readAdminData();

  const rows: Row[] = [
    // produk sendiri lebih dulu — itu yang paling sering diurus
    ...admin.products.map(
      (p): Row => ({
        id: p.id,
        slug: p.slug,
        source: 'sendiri',
        name: p.name,
        categoryName: p.categoryName,
        price: p.price,
        stock: p.stock,
        image: p.images[0] ?? null,
        hidden: p.hidden,
        featured: p.featured,
        edited: false,
      }),
    ),
    ...shopeeProducts.map((p): Row => {
      const override = admin.overrides[p.id] ?? admin.overrides[p.slug];
      return {
        id: p.id,
        slug: override?.slug ?? p.slug,
        source: 'shopee',
        name: override?.name ?? p.name,
        categoryName: p.category.name,
        price: override?.price ?? p.price,
        stock: override?.stock ?? p.stock,
        image: override?.images?.[0] ?? p.images[0] ?? null,
        hidden: override?.hidden ?? false,
        featured: override?.featured ?? false,
        edited: Boolean(override),
      };
    }),
  ];

  const term = q.trim().toLowerCase();
  const visible = term
    ? rows.filter((r) =>
        `${r.name} ${r.categoryName} ${r.slug}`.toLowerCase().includes(term),
      )
    : rows;

  const ownCount = admin.products.length;
  const hiddenCount = rows.filter((r) => r.hidden).length;

  return (
    <>
      {pesan && (
        <p className="mb-5 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-medium text-brand-dark">
          {pesan}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Produk</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} total &middot; {ownCount} produk sendiri &middot; {shopeeProducts.length} dari
            Shopee
            {hiddenCount > 0 && <> &middot; {hiddenCount} disembunyikan</>}
          </p>
        </div>

        <Link
          href="/admin/produk/baru"
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          + Tambah produk
        </Link>
      </div>

      <form className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cari nama, kategori, atau slug..."
          className="w-full max-w-md rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />
      </form>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Produk</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 text-right font-medium">Harga</th>
              <th className="px-4 py-3 text-right font-medium">Stok</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-line/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                      <SafeImage src={row.image} alt="" sizes="44px" className="object-contain p-1" />
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-medium">{row.name}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {row.source === 'sendiri' ? 'Produk sendiri' : 'Dari Shopee'}
                        {row.edited && ' · diedit'}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{row.categoryName}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(row.price)}</td>
                <td className="px-4 py-3 text-right">{row.stock}</td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {row.hidden ? (
                      <Badge tone="muted">Disembunyikan</Badge>
                    ) : row.stock > 0 ? (
                      <Badge tone="brand">Tayang</Badge>
                    ) : (
                      <Badge tone="accent">Stok habis</Badge>
                    )}
                    {row.featured && <Badge tone="accent">Unggulan</Badge>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/produk/${row.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold transition-colors hover:border-brand/50"
                    >
                      Edit
                    </Link>

                    <form action={toggleHiddenAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand/50 hover:text-ink"
                      >
                        {row.hidden ? 'Tampilkan' : 'Sembunyikan'}
                      </button>
                    </form>

                    {row.source === 'sendiri' ? (
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent/60 hover:text-accent"
                        >
                          Hapus
                        </button>
                      </form>
                    ) : (
                      row.edited && (
                        <form action={resetOverrideAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button
                            type="submit"
                            title="Buang editan, kembali ke data asli dari Shopee"
                            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand/50 hover:text-ink"
                          >
                            Reset
                          </button>
                        </form>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visible.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-muted">
            Tidak ada produk yang cocok dengan &ldquo;{q}&rdquo;.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Produk dari Shopee tidak bisa dihapus di sini — hasil{' '}
        <code className="font-mono">npm run import</code> berikutnya akan memunculkannya lagi. Pakai
        &ldquo;Sembunyikan&rdquo; kalau tidak ingin ditampilkan. Editan atas produk Shopee disimpan
        terpisah, jadi tidak ikut tertimpa saat import ulang.
      </p>
    </>
  );
}

function Badge({ tone, children }: { tone: 'brand' | 'accent' | 'muted'; children: React.ReactNode }) {
  const styles = {
    brand: 'bg-brand-soft text-brand-dark',
    accent: 'bg-accent-soft text-accent',
    muted: 'bg-line/70 text-muted',
  }[tone];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}>{children}</span>
  );
}
