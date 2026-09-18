import { Fragment } from 'react';

const BULLET = /^[-•*]\s*/;

/** Deskripsi Shopee = teks polos. Baris berawalan "-" dijadikan list,
 *  sisanya jadi paragraf. */
export function Description({ text }: { text: string }) {
  if (!text.trim()) {
    return <p className="text-sm text-muted">Belum ada deskripsi untuk produk ini.</p>;
  }

  const blocks: { type: 'p' | 'ul'; lines: string[] }[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isBullet = BULLET.test(trimmed);
    const last = blocks[blocks.length - 1];

    if (isBullet) {
      const content = trimmed.replace(BULLET, '');
      if (last?.type === 'ul') last.lines.push(content);
      else blocks.push({ type: 'ul', lines: [content] });
    } else {
      blocks.push({ type: 'p', lines: [trimmed] });
    }
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted">
      {blocks.map((block, i) => (
        <Fragment key={i}>
          {block.type === 'ul' ? (
            <ul className="space-y-1.5 pl-1">
              {block.lines.map((line, j) => (
                <li key={j} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{block.lines[0]}</p>
          )}
        </Fragment>
      ))}
    </div>
  );
}
