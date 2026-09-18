'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  src: string | null | undefined;
  alt: string;
  /** Wajib diisi supaya next/image memilih ukuran yang pas di mobile. */
  sizes: string;
  className?: string;
  priority?: boolean;
};

/** next/image yang selalu memenuhi parent (parent harus `relative`),
 *  dan otomatis jadi placeholder kalau URL-nya mati. */
export function SafeImage({ src, alt, sizes, className = 'object-contain', priority }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-line/40 text-muted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-10 w-10 opacity-60">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m4 17 5-5 4 4 3-2 4 4" />
        </svg>
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
