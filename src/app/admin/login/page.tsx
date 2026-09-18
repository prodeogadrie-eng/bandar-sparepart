import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { adminConfigured, isLoggedIn } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { LoginForm } from './LoginForm';

/**
 * Per request, bukan saat build: status ADMIN_PASSWORD dibaca dari environment
 * saat halaman dibuka. Kalau diprerender, halaman ini akan selamanya bilang
 * "belum diaktifkan" walau environment variable-nya sudah diisi di Netlify.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Masuk Admin',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await isLoggedIn()) redirect('/admin');

  return (
    <div className="grid min-h-dvh place-items-center bg-page px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="mt-4 text-xl font-extrabold tracking-tight">Panel Admin</h1>
          <p className="mt-1 text-sm text-muted">Masuk untuk mengelola produk.</p>
        </div>

        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <div className="mt-8 rounded-2xl border border-accent/40 bg-accent-soft p-5 text-sm leading-relaxed">
            <p className="font-semibold text-ink">Panel admin belum diaktifkan.</p>
            <p className="mt-2 text-ink/80">
              Buat environment variable <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">ADMIN_PASSWORD</code>{' '}
              di dashboard Netlify (Site configuration → Environment variables), lalu deploy ulang.
            </p>
            <p className="mt-2 text-ink/80">
              Untuk mencoba di komputer sendiri, isi file{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">.env.local</code>:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-ink px-3 py-2 font-mono text-xs text-white">
              ADMIN_PASSWORD=passwordpilihanmu
            </pre>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          <a href="/" className="hover:text-brand">
            &larr; Kembali ke toko
          </a>
        </p>
      </div>
    </div>
  );
}
