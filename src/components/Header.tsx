'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import siteConfig from '@config';
import { useCart } from './CartProvider';
import { Logo } from './Logo';
import { generalChatLink } from '@/lib/whatsapp';

const NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/produk', label: 'Katalog' },
  { href: '/keranjang', label: 'Keranjang' },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Logo size={42} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold leading-tight">
              {siteConfig.brand.name}
            </span>
            <span className="hidden text-xs text-muted sm:block">{siteConfig.brand.tagline}</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href) ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={generalChatLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Chat Admin
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link
            href="/produk"
            aria-label="Cari produk"
            className="grid h-10 w-10 place-items-center rounded-xl text-ink transition-colors hover:bg-page md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </Link>

          <Link
            href="/keranjang"
            aria-label={`Keranjang${ready && count ? `, ${count} item` : ''}`}
            className={`relative grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-page ${
              isActive('/keranjang') ? 'text-brand' : 'text-ink'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.55L20 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="20" r="1.3" />
              <circle cx="17" cy="20" r="1.3" />
            </svg>
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
