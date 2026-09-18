/**
 * ============================================================
 *  SATU-SATUNYA FILE YANG PERLU KAMU UBAH
 * ============================================================
 *  Nama brand, warna, nomor WhatsApp, dan info kontak semua ada di sini.
 *  Setelah diubah, jalankan ulang `npm run dev` atau `npm run build`.
 */

export type SiteConfig = {
  brand: {
    name: string;
    initials: string;
    logo: string | null;
    tagline: string;
    description: string;
    url: string;
  };
  whatsapp: { number: string; orderIntro: string; orderOutro: string; generalGreeting: string };
  colors: {
    brand: string;
    brandDark: string;
    brandSoft: string;
    accent: string;
    accentSoft: string;
    ink: string;
    muted: string;
    line: string;
    surface: string;
    page: string;
    whatsapp: string;
  };
  contact: {
    email: string;
    phoneLabel: string;
    address: string;
    hours: string;
    instagram: string;
    shopee: string;
  };
  catalog: { featuredSlugs: string[]; featuredCount: number; priceNote: string };
  home: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    benefits: { title: string; text: string }[];
  };
};

export const siteConfig: SiteConfig = {
  brand: {
    name: 'Bandar Sparepart',
    /** Cadangan kalau `logo` dikosongkan. */
    initials: 'BS',
    /**
     * File logo di folder public/. Ganti file-nya saja kalau logo berubah,
     * lalu jalankan `npm run icon` untuk memperbarui favicon.
     * Isi null kalau mau pakai inisial saja.
     */
    logo: '/logo.png',
    tagline: 'Sparepart Truk China & Alat Berat',
    description:
      'Suku cadang truk berat dan alat berat: clutch booster, turbocharger, air compressor, sampai part kelistrikan. Stok siap kirim, dijamin sesuai nomor part.',
    /** Dipakai untuk link produk di pesan WhatsApp & metadata SEO.
     *  Ganti kalau nanti sudah pakai domain sendiri. */
    url: 'https://bandarsparepart.netlify.app',
  },

  whatsapp: {
    /**
     * GANTI DENGAN NOMOR WHATSAPP KAMU.
     * Boleh format apa saja: '0851 8301 901', '+62 851-8301-901', atau '62851830190'.
     * Angka 0 di depan otomatis diubah jadi 62.
     */
    number: '6285183019018',
    /** Pembuka pesan checkout. {brand} otomatis diganti nama brand. */
    orderIntro: 'Halo {brand}, saya mau pesan:',
    /** Penutup pesan checkout. */
    orderOutro: 'Mohon dikonfirmasi ketersediaan stok dan ongkir ke alamat saya. Terima kasih!',
    /** Pesan tombol "Chat Admin" (tanpa keranjang). */
    generalGreeting: 'Halo {brand}, saya mau tanya soal produk.',
  },

  /**
   * Warna utama toko — diambil dari logo Bandar Sparepart.
   * Cukup ganti hex-nya, seluruh halaman ikut berubah.
   *
   * Mau oranye yang jadi warna tombol (bukan hijau)? Tukar saja nilai
   * `brand` dengan `accent`, dan `brandSoft` dengan `accentSoft`.
   */
  colors: {
    /** Hijau cincin logo, digelapkan supaya teks putih di atasnya tetap terbaca. */
    brand: '#0E6B55',
    brandDark: '#0A5342',
    brandSoft: '#E8F3EF',
    /** Oranye sunburst di logo. Dipakai untuk penanda: sisa stok, angka, garis aksen. */
    accent: '#F26A05',
    accentSoft: '#FFF1E3',
    /** Charcoal badan logo. */
    ink: '#111C1E',
    muted: '#5C6B6A',
    line: '#DCE5E2',
    surface: '#FFFFFF',
    page: '#F5F8F6',
    whatsapp: '#25D366',
  },

  contact: {
    email: '',
    phoneLabel: '',
    address: '',
    hours: 'Senin - Sabtu, 08.00 - 17.00 WIB',
    instagram: '',
    shopee: '',
  },

  /** Pengaturan katalog. */
  catalog: {
    /**
     * Produk unggulan di halaman depan.
     * Isi dengan slug produk, contoh: ['turbocharger-holset-hx50w'].
     * Kalau dikosongkan, dipilih otomatis dari produk yang stoknya ada.
     */
    featuredSlugs: [],
    featuredCount: 6,
    /** Catatan kecil di bawah harga. Kosongkan untuk menyembunyikan. */
    priceNote: 'Harga belum termasuk ongkir',
  },

  /** Kalimat-kalimat di halaman depan. */
  home: {
    heroEyebrow: 'Ready stock & siap kirim',
    heroTitle: 'Sparepart Truk dan Alat Berat Terpercaya, bisa satuan atau Grosir',
    heroSubtitle:
      'Semua part dicek nomor OEM-nya sebelum dikirim. Pesan lewat WhatsApp, dibalas orang beneran, bukan bot.',
    benefits: [
      { title: 'Nomor part dijamin', text: 'Setiap produk dicantumkan OE/OEM number-nya biar tidak salah beli.' },
      { title: 'Stok real-time', text: 'Jumlah stok di katalog ini diambil langsung dari data gudang.' },
      { title: 'Checkout via WhatsApp', text: 'Tanpa ribet daftar akun. Pesanan langsung masuk ke chat admin.' },
    ],
  },
};

export default siteConfig;
