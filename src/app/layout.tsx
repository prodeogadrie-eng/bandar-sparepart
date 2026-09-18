import type { Metadata, Viewport } from 'next';
import type { CSSProperties } from 'react';
import siteConfig from '@config';
import './globals.css';

const { brand, colors } = siteConfig;

export const metadata: Metadata = {
  ...(brand.url ? { metadataBase: new URL(brand.url) } : {}),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s — ${brand.name}`,
  },
  description: brand.description,
  openGraph: {
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    type: 'website',
    locale: 'id_ID',
    siteName: brand.name,
  },
};

export const viewport: Viewport = {
  themeColor: colors.brand,
};

/** Warna dari site.config.ts dipasang sebagai CSS variable di <html>,
 *  jadi cukup ubah satu file untuk mengganti tema seluruh situs. */
const themeVars = {
  '--brand': colors.brand,
  '--brand-dark': colors.brandDark,
  '--brand-soft': colors.brandSoft,
  '--accent': colors.accent,
  '--accent-soft': colors.accentSoft,
  '--ink': colors.ink,
  '--muted': colors.muted,
  '--line': colors.line,
  '--surface': colors.surface,
  '--page': colors.page,
  '--wa': colors.whatsapp,
} as CSSProperties;

/**
 * Hanya kerangka dokumen dan tema. Chrome toko (header/footer) ada di
 * src/app/(toko)/layout.tsx, sedangkan admin punya tampilannya sendiri.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" style={themeVars}>
      <body>{children}</body>
    </html>
  );
}
