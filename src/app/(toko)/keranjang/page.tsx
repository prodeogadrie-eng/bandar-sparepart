import type { Metadata } from 'next';
import { CartView } from '@/components/CartView';

export const metadata: Metadata = {
  title: 'Keranjang',
  description: 'Produk yang siap kamu pesan lewat WhatsApp.',
};

export default function CartPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Keranjang</h1>
      <p className="mt-2 text-sm text-muted">
        Cek dulu jumlah dan variannya. Pembayaran diatur setelah admin konfirmasi stok & ongkir.
      </p>

      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
