import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/* ------------------------------------------------------------------ *
 * Penjaga halaman admin.
 *
 * Password TIDAK disimpan di dalam kode. Ia dibaca dari environment
 * variable ADMIN_PASSWORD yang kamu isi sendiri di dashboard Netlify,
 * jadi tidak pernah masuk ke repo dan tidak pernah terlihat siapa pun
 * selain kamu.
 *
 * Kalau ADMIN_PASSWORD belum diisi, halaman admin dikunci total
 * (bukan dibuka) — lebih baik tidak bisa dipakai daripada bisa dibuka
 * siapa saja.
 * ------------------------------------------------------------------ */

const COOKIE_NAME = 'bs_admin';
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

function secret(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length > 0 ? value : null;
}

export function adminConfigured(): boolean {
  return secret() !== null;
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('hex');
}

function sameString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function makeToken(key: string): string {
  const expires = String(Date.now() + SESSION_MS);
  return `${expires}.${sign(expires, key)}`;
}

function tokenValid(token: string, key: string): boolean {
  const dot = token.indexOf('.');
  if (dot < 1) return false;

  const expires = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const asNumber = Number(expires);
  if (!Number.isFinite(asNumber) || asNumber < Date.now()) return false;

  return sameString(signature, sign(expires, key));
}

export async function isLoggedIn(): Promise<boolean> {
  const key = secret();
  if (!key) return false;

  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return token ? tokenValid(token, key) : false;
}

/**
 * Membantu menemukan sebab kalau ADMIN_PASSWORD sudah diisi di Netlify tapi
 * fungsi server tidak melihatnya. Hanya melaporkan ADA/TIDAK dan jumlah —
 * tidak pernah menampilkan nilai environment variable mana pun.
 */
export function envDiagnostics(): Record<string, string> {
  const ada = (key: string) => (process.env[key] ? 'terbaca' : 'tidak terbaca');
  return {
    ADMIN_PASSWORD: ada('ADMIN_PASSWORD'),
    NODE_VERSION: ada('NODE_VERSION'),
    NETLIFY: ada('NETLIFY'),
    'jumlah variable': String(Object.keys(process.env).length),
  };
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(submitted: string): Promise<LoginResult> {
  const key = secret();
  if (!key) {
    return {
      ok: false,
      error:
        'Halaman admin belum diaktifkan. Isi environment variable ADMIN_PASSWORD di dashboard Netlify lebih dulu.',
    };
  }

  if (!sameString(submitted, key)) {
    return { ok: false, error: 'Password salah.' };
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(key), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MS / 1000,
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Dipakai di setiap aksi yang menulis data — jangan hanya mengandalkan layout. */
export async function requireAdmin(): Promise<void> {
  if (!(await isLoggedIn())) throw new Error('Tidak punya akses.');
}
