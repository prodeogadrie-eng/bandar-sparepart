'use client';

import { useEffect, useState } from 'react';
import { SafeImage } from './SafeImage';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  // Kalau daftar gambar berubah (mis. pindah produk), balik ke gambar pertama.
  useEffect(() => setActive(0), [images]);

  const current = images[active];

  return (
    <div className="lg:sticky lg:top-24">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-white">
        <SafeImage
          src={current}
          alt={name}
          sizes="(min-width: 1024px) 45vw, 100vw"
          priority
          className="object-contain p-4"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Lihat gambar ${i + 1} dari ${images.length}`}
              aria-current={i === active}
              className={`relative aspect-square w-18 shrink-0 overflow-hidden rounded-xl border bg-white transition-colors ${
                i === active ? 'border-brand ring-1 ring-brand' : 'border-line hover:border-brand/40'
              }`}
            >
              <SafeImage src={src} alt="" sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
