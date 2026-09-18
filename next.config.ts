import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Formulir admin ikut mengunggah foto. Batas bawaan 1 MB terlalu kecil
      // untuk foto dari HP; foto dikecilkan setelah diterima (src/lib/image.ts).
      bodySizeLimit: '25mb',
    },
  },
  images: {
    // Gambar produk masih di-host CDN Shopee.
    remotePatterns: [
      { protocol: 'https', hostname: 'cf.shopee.co.id' },
      { protocol: 'https', hostname: '**.shopee.co.id' },
      { protocol: 'https', hostname: '**.susercontent.com' },
    ],
  },
};

export default nextConfig;
