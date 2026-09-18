import type { Metadata } from 'next';
import { Fragment } from 'react';
import { redirect } from 'next/navigation';
import { adminConfigured, envDiagnostics, isLoggedIn } from '@/lib/auth';
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

            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold text-ink/70">
                Sudah diisi tapi masih muncul pesan ini?
              </summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] text-ink/80">
                {Object.entries(envDiagnostics()).map(([key, value]) => (
                  <Fragment key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </Fragment>
                ))}
              </dl>
              <p className="mt-2 text-xs leading-relaxed text-ink/70">
                Hanya menampilkan ada/tidaknya, tidak pernah isinya. Kalau variabel lain
                terbaca tapi ADMIN_PASSWORD tidak, biasanya variabelnya ditandai
                &ldquo;secret&rdquo; di Netlify — matikan tanda itu, lalu deploy ulang.
              </p>
            </details>
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
