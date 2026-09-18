import siteConfig from '@config';
import { formatRupiah } from './format';
import type { CartItem } from './types';

/** '0851 8301 901' / '+62 851-8301-901' -> '62851830190' */
export function normalizeWhatsAppNumber(raw: string): string {
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('620')) digits = '62' + digits.slice(3);
  else if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (!digits.startsWith('62')) digits = '62' + digits;
  return digits;
}

export function whatsAppLink(message: string): string {
  const number = normalizeWhatsAppNumber(siteConfig.whatsapp.number);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const withBrand = (text: string) => text.replace(/\{brand\}/g, siteConfig.brand.name);

/** Tombol "Chat Admin" biasa. */
export function generalChatLink(extra?: string): string {
  const base = withBrand(siteConfig.whatsapp.generalGreeting);
  return whatsAppLink(extra ? `${base}\n\n${extra}` : base);
}

/** Tanya satu produk langsung dari halaman detail. */
export function productInquiryLink(name: string, slug: string): string {
  const lines = [
    withBrand(siteConfig.whatsapp.generalGreeting),
    '',
    `Produk: ${name}`,
  ];
  const url = productUrl(slug);
  if (url) lines.push(url);
  return whatsAppLink(lines.join('\n'));
}

function productUrl(slug: string): string | null {
  const base = siteConfig.brand.url.replace(/\/+$/, '');
  return base ? `${base}/produk/${slug}` : null;
}

export type CheckoutDetails = {
  name?: string;
  phone?: string;
  address?: string;
  note?: string;
};

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

/** Menyusun pesan pesanan yang rapi dan enak dibaca di WhatsApp. */
export function buildOrderMessage(items: CartItem[], details: CheckoutDetails = {}): string {
  const lines: string[] = [withBrand(siteConfig.whatsapp.orderIntro), ''];

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`);
    if (item.variantName) lines.push(`   Varian: ${item.variantName}`);
    lines.push(`   ${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(item.price * item.qty)}`);
    const url = productUrl(item.slug);
    if (url) lines.push(`   ${url}`);
    lines.push('');
  });

  lines.push(`Total: ${formatRupiah(cartTotal(items))}`);

  const buyer = [
    details.name && `Nama: ${details.name.trim()}`,
    details.phone && `No. HP: ${details.phone.trim()}`,
    details.address && `Alamat: ${details.address.trim()}`,
    details.note && `Catatan: ${details.note.trim()}`,
  ].filter(Boolean) as string[];

  if (buyer.length) lines.push('', ...buyer);

  lines.push('', withBrand(siteConfig.whatsapp.orderOutro));

  return lines.join('\n');
}

export function checkoutLink(items: CartItem[], details: CheckoutDetails = {}): string {
  return whatsAppLink(buildOrderMessage(items, details));
}
