import Image from 'next/image';
import siteConfig from '@config';

/** Logo toko. Kalau `brand.logo` dikosongkan di site.config.ts,
 *  otomatis jatuh ke badge inisial. */
export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  const { logo, name, initials } = siteConfig.brand;

  if (!logo) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-xl bg-brand font-bold tracking-tight text-white ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
      >
        {initials}
      </span>
    );
  }

  return (
    <span className={`relative block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Image
        src={logo}
        alt={name}
        fill
        sizes={`${size * 2}px`}
        priority
        className="object-contain"
      />
    </span>
  );
}
