import Link from 'next/link';
import siteConfig from '@config';
import { getCatalog } from '@/lib/catalog';
import { generalChatLink } from '@/lib/whatsapp';
import { WhatsAppIcon } from './icons';
import { Logo } from './Logo';

export async function Footer() {
  const { brand, contact } = siteConfig;
  const { categories } = await getCatalog();

  const links = [
    contact.email ? { label: contact.email, href: `mailto:${contact.email}` } : null,
    contact.instagram ? { label: 'Instagram', href: contact.instagram } : null,
    contact.shopee ? { label: 'Toko Shopee', href: contact.shopee } : null,
  ].filter((link): link is { label: string; href: string } => link !== null);

  return (
    <footer className="mt-20 bg-ink text-white/70">
      {/* garis oranye, mengambil sunburst di logo */}
      <div className="h-1 bg-accent" />

      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Logo size={52} />
            <span className="text-base font-semibold text-white">{brand.name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{brand.description}</p>
          <a
            href={generalChatLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-wa px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <WhatsAppIcon />
            Chat via WhatsApp
          </a>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Kategori</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/produk?kategori=${category.slug}`}
                  className="transition-colors hover:text-accent"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Kontak</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {contact.hours && <li>{contact.hours}</li>}
            {contact.address && <li>{contact.address}</li>}
            {contact.phoneLabel && <li>{contact.phoneLabel}</li>}
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-1 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {brand.name}. Semua hak dilindungi.
          </p>
          <p>Pemesanan diproses lewat WhatsApp.</p>
        </div>
      </div>
    </footer>
  );
}
