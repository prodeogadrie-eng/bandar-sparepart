/** Potong teks jadi ringkasan pendek tanpa memotong kata di tengah. */
export function excerptOf(text: string, max = 165): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return cut.slice(0, space > 40 ? space : max).trim() + '…';
}
