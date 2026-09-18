const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'Hubungi kami';
  return rupiah.format(value);
}

/** Versi tanpa simbol mata uang, untuk pesan WhatsApp: "Rp950.000". */
export function formatRupiah(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '-';
  return 'Rp' + new Intl.NumberFormat('id-ID').format(Math.round(value));
}

export function formatWeight(gram: number | null): string | null {
  if (!gram || gram <= 0) return null;
  return gram >= 1000 ? `${(gram / 1000).toLocaleString('id-ID')} kg` : `${gram} g`;
}
