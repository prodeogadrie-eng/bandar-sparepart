import { CartProvider } from '@/components/CartProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';

/**
 * Tampilan toko: header, footer, tombol WhatsApp, dan keranjang.
 *
 * Halaman admin ada di luar grup ini supaya tidak kebagian chrome toko —
 * nama folder dalam tanda kurung tidak ikut jadi bagian URL.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingWhatsApp />
      </div>
    </CartProvider>
  );
}
