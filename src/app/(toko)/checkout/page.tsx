import type { Metadata } from 'next';
import { CheckoutView } from '@/components/CheckoutView';

export const metadata: Metadata = {
  title: 'Checkout via WhatsApp',
  description: 'Isi data pengiriman, lalu kirim pesanan langsung ke admin lewat WhatsApp.',
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Checkout</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Pesanan diproses lewat WhatsApp. Setelah tombol ditekan, aplikasi WhatsApp terbuka dengan pesan
        pesanan yang sudah lengkap — kamu tinggal kirim.
      </p>

      <div className="mt-8">
        <CheckoutView />
      </div>
    </div>
  );
}
