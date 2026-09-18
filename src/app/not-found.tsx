import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <p className="text-sm font-semibold text-brand">404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Halaman tidak ditemukan</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Produk mungkin sudah tidak tayang atau alamatnya salah ketik. Coba cari lagi di katalog.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/produk"
            className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Buka katalog
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold transition-colors hover:border-brand/50"
          >
            Ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
