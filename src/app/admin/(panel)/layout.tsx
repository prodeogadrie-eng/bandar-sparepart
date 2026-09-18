import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import siteConfig from '@config';
import { Logo } from '@/components/Logo';
import { isLoggedIn } from '@/lib/auth';
import { storageKind } from '@/lib/store';
import { logoutAction } from '../actions';

/**
 * Seluruh panel harus dirender per request. Tanpa ini Next bisa memprerender
 * sebagian halaman admin saat build — penjaga login tidak ikut jalan dan
 * formulirnya bisa terbaca tanpa masuk.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Penjaga utama. Aksi yang menulis data punya pemeriksaan sendiri
  // (requireAdmin) — layout saja tidak melindungi server action.
  if (!(await isLoggedIn())) redirect('/admin/login');

  const storage = await storageKind();

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="text-sm font-semibold">
              Admin <span className="text-muted">/ {siteConfig.brand.name}</span>
            </span>
          </Link>

          <span
            className="ml-2 hidden rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted sm:inline"
            title={
              storage === 'netlify-blobs'
                ? 'Data disimpan di Netlify Blobs'
                : 'Data disimpan di folder data/admin/ di komputer ini'
            }
          >
            {storage === 'netlify-blobs' ? 'Netlify Blobs' : 'Penyimpanan lokal'}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="rounded-xl border border-line px-3 py-2 text-xs font-semibold transition-colors hover:border-brand/50"
            >
              Lihat toko
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-accent/50 hover:text-accent"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
