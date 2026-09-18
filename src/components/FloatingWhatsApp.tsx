'use client';

import { usePathname } from 'next/navigation';
import { generalChatLink } from '@/lib/whatsapp';
import { WhatsAppIcon } from './icons';

/** Tombol chat mengambang. Disembunyikan di halaman keranjang & checkout
 *  supaya tidak menutupi tombol pesanan yang menempel di bawah. */
export function FloatingWhatsApp() {
  const pathname = usePathname();
  if (pathname.startsWith('/keranjang') || pathname.startsWith('/checkout')) return null;

  return (
    <a
      href={generalChatLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat admin via WhatsApp"
      className="fixed bottom-5 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-wa text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
