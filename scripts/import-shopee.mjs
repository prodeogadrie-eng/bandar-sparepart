/**
 * Importer katalog Shopee -> data/products.json
 *
 * Cara pakai:
 *   npm run import                    (baca semua .xlsx di data/shopee)
 *   npm run import -- "D:\export"     (baca folder lain)
 *   npm run import -- --no-download    (pakai URL gambar Shopee, jangan diunduh)
 *
 * Gambar produk diunduh ke public/produk/ supaya toko tidak bergantung pada
 * CDN Shopee (lebih cepat, dan tetap hidup kalau produknya dihapus di Shopee).
 *
 * Tidak butuh dependency apa pun: .xlsx dibongkar manual (zip + XML).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const DOWNLOAD_IMAGES = !args.includes('--no-download');
const srcArg = args.find((a) => !a.startsWith('--'));

const SRC_DIR = path.resolve(ROOT, srcArg ?? 'data/shopee');
const OUT_FILE = path.join(ROOT, 'data', 'products.json');
const IMG_DIR = path.join(ROOT, 'public', 'produk');
const IMG_PUBLIC_PATH = '/produk';

/* ------------------------------------------------------------------ */
/* 1. Pembaca .xlsx minimalis (zip + sharedStrings + sheet XML)        */
/* ------------------------------------------------------------------ */

function unzip(buf) {
  let eocd = -1;
  const min = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('File bukan .xlsx yang valid (EOCD tidak ketemu)');

  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const files = new Map();

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);

    const lhNameLen = buf.readUInt16LE(localOff + 26);
    const lhExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lhNameLen + lhExtraLen;
    const raw = buf.subarray(start, start + compSize);

    files.set(name, method === 0 ? raw : inflateRawSync(raw));
    off += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeXml(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (m, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code] ?? m;
  });
}

function textOf(xml) {
  let out = '';
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += decodeXml(m[1]);
  return out;
}

function colIndex(ref) {
  const letters = /^([A-Z]+)/.exec(ref)?.[1] ?? 'A';
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** Semua sheet dalam satu workbook -> array of rows (row = array of string). */
function readWorkbook(file) {
  const zip = unzip(readFileSync(file));

  const sharedRaw = zip.get('xl/sharedStrings.xml');
  const shared = [];
  if (sharedRaw) {
    for (const m of sharedRaw.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      shared.push(textOf(m[1]));
    }
  }

  const sheetFiles = [...zip.keys()]
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  return sheetFiles.map((name) => {
    const xml = zip.get(name).toString('utf8');
    const rows = [];

    for (const rowM of xml.matchAll(/<row\b[^>]*(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const body = rowM[1] ?? '';
      const cells = new Map();

      for (const cm of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = cm[1];
        const inner = cm[2] ?? '';
        const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
        if (!ref) continue;

        const type = /t="([^"]+)"/.exec(attrs)?.[1];
        let value = '';
        if (type === 's') {
          const idx = Number(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? -1);
          value = shared[idx] ?? '';
        } else if (type === 'inlineStr') {
          value = textOf(inner);
        } else {
          value = decodeXml(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '');
        }
        cells.set(colIndex(ref), String(value).trim());
      }

      const width = cells.size ? Math.max(...cells.keys()) + 1 : 0;
      rows.push(Array.from({ length: width }, (_, i) => cells.get(i) ?? ''));
    }
    return rows;
  });
}

/* ------------------------------------------------------------------ */
/* 2. Normalisasi nilai                                               */
/* ------------------------------------------------------------------ */

const ID_RE = /^\d{5,}$/;

const clean = (s) =>
  String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufeff\ufffd]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

/** "Rp 1.500.000" / "1500000.00" -> 1500000 */
function toNumber(v) {
  const s = String(v ?? '').replace(/[^\d.,-]/g, '').trim();
  if (!s) return null;
  const normalized =
    s.includes(',') && s.includes('.')
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(/,/g, '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

const toInt = (v) => {
  const n = toNumber(v);
  return n === null ? null : Math.round(n);
};

function slugify(s) {
  return (
    clean(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'produk'
  );
}

/**
 * Deskripsi Shopee sering "nempel" tanpa baris baru, contoh:
 *   "...part tersebut:Spesifikasi & Detail ProdukNama Komponen: Clutch Booster"
 * Dipecah lagi jadi baris supaya enak dibaca.
 */
function cleanDescription(raw) {
  let d = clean(raw);
  if (!d) return '';
  d = d.replace(/([a-z0-9)\].:])(?=[A-Z][A-Za-z&/ ]{2,40}:)/g, '$1\n');
  d = d.replace(/\n{3,}/g, '\n\n');
  return d
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();
}

function excerpt(text, max = 165) {
  const flat = clean(text).replace(/\s+/g, ' ');
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return cut.slice(0, space > 40 ? space : max).trim() + '\u2026';
}

const GENERIC = new Set(['others', 'other', 'lainnya', 'lain-lain', 'etc']);

/** "101457 - Automobiles/Automobile Spare Parts/Others" -> kategori rapi */
function parseCategory(raw) {
  const value = clean(raw);
  if (!value) return { id: null, name: 'Lainnya', slug: 'lainnya', path: [] };

  const m = /^(\d+)\s*-\s*(.*)$/.exec(value);
  const id = m ? m[1] : null;
  const path = (m ? m[2] : value)
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);

  let name = path[path.length - 1] ?? 'Lainnya';
  for (let i = path.length - 1; i >= 0; i--) {
    if (!GENERIC.has(path[i].toLowerCase())) {
      name = path[i];
      break;
    }
  }
  return { id, name, slug: slugify(name), path };
}

/* ------------------------------------------------------------------ */
/* 3. Unduh gambar produk ke public/produk                            */
/* ------------------------------------------------------------------ */

const EXT_BY_TYPE = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
};

const EXTENSIONS = [...new Set(Object.values(EXT_BY_TYPE))];

async function downloadImage(url, destBase) {
  // Sudah pernah diunduh di import sebelumnya? Pakai yang ada.
  for (const ext of EXTENSIONS) {
    const file = destBase + ext;
    if (existsSync(file) && statSync(file).size > 0) {
      return `${IMG_PUBLIC_PATH}/${path.basename(file)}`;
    }
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error('file kosong');

  const file = destBase + (EXT_BY_TYPE[type] ?? '.jpg');
  writeFileSync(file, buffer);
  return `${IMG_PUBLIC_PATH}/${path.basename(file)}`;
}

/** Mengunduh semua gambar (6 sekaligus) dan mengganti URL-nya jadi path lokal.
 *  Gambar yang gagal diunduh tetap memakai URL Shopee. */
async function downloadAllImages(products) {
  mkdirSync(IMG_DIR, { recursive: true });

  const jobs = [];
  for (const product of products) {
    product.remoteImages = [...product.images];
    product.images.forEach((url, index) => jobs.push({ product, index, url }));
  }
  if (!jobs.length) return { failed: 0 };

  let cursor = 0;
  let done = 0;
  let failed = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const destBase = path.join(IMG_DIR, `${job.product.slug}-${job.index + 1}`);
      try {
        job.local = await downloadImage(job.url, destBase);
      } catch {
        try {
          job.local = await downloadImage(job.url, destBase); // sekali percobaan ulang
        } catch (err) {
          failed++;
          job.error = err instanceof Error ? err.message : String(err);
        }
      }
      done++;
      process.stdout.write(`\r  mengunduh gambar ${done}/${jobs.length}   `);
    }
  }

  await Promise.all(Array.from({ length: Math.min(6, jobs.length) }, worker));
  process.stdout.write('\n');

  for (const job of jobs) {
    if (job.local) job.product.images[job.index] = job.local;
  }
  return { failed };
}

/* ------------------------------------------------------------------ */
/* 4. Baca semua file, gabungkan per Kode Produk                      */
/* ------------------------------------------------------------------ */

// header teknis Shopee (baris pertama) -> field internal kita
const FIELD = {
  et_title_product_id: 'id',
  et_title_product_name: 'name',
  et_title_product_description: 'description',
  et_title_parent_sku: 'sku',
  et_title_product_category: 'categoryRaw',
  et_title_product_sales: 'sold',
  et_title_product_weight: 'weightGram',
  et_title_product_length: 'length',
  et_title_product_width: 'width',
  et_title_product_height: 'height',
  et_title_product_dts: 'shipDays',
  et_title_non_pre_order_dts: 'shipDaysNonPreorder',
  ps_item_cover_image: 'coverImage',
  et_title_variation_id: 'variationId',
  et_title_variation_name: 'variationName',
  et_title_variation_sku: 'variationSku',
  et_title_variation_price: 'variationPrice',
  et_title_variation_stock: 'variationStock',
  et_title_option_image_1_for_variation_1: 'variationImage',
};

function fieldFor(header) {
  const key = clean(header);
  if (FIELD[key]) return FIELD[key];
  if (/^ps_item_image\.\d+$/.test(key)) return 'image:' + key.split('.')[1];
  return null;
}

/**
 * Ambil baris data dari satu workbook.
 * Header teknis dicari otomatis (bukan selalu baris pertama), dan semua baris
 * meta / instruksi / kosong dibuang karena kolom Kode Produk-nya bukan angka.
 */
function collectRows(file) {
  const out = [];

  for (const rows of readWorkbook(file)) {
    const headerIdx = rows.findIndex((r) => r.some((c) => clean(c) === 'et_title_product_id'));
    if (headerIdx === -1) continue;

    const header = rows[headerIdx];
    const idCol = header.findIndex((c) => clean(c) === 'et_title_product_id');

    for (const row of rows.slice(headerIdx + 1)) {
      if (!ID_RE.test(clean(row[idCol]))) continue;

      const rec = {};
      header.forEach((h, i) => {
        const field = fieldFor(h);
        if (!field) return;
        const value = clean(row[i]);
        if (value) rec[field] = value;
      });
      if (rec.id) out.push(rec);
    }
  }
  return out;
}

function setIfEmpty(obj, key, value) {
  if (value === undefined || value === null || value === '') return;
  if (obj[key] === undefined || obj[key] === '') obj[key] = value;
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Folder sumber tidak ditemukan: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(SRC_DIR)
    .filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$'))
    .map((f) => path.join(SRC_DIR, f));

  if (!files.length) {
    console.error(`Tidak ada file .xlsx di ${SRC_DIR}`);
    process.exit(1);
  }

  console.log(`Membaca ${files.length} file dari ${SRC_DIR}`);

  const byId = new Map();
  let rowCount = 0;

  for (const file of files) {
    let rows;
    try {
      rows = collectRows(file);
    } catch (err) {
      console.warn(`  ! Lewati ${path.basename(file)}: ${err.message}`);
      continue;
    }
    console.log(`  - ${path.basename(file)}: ${rows.length} baris data`);
    rowCount += rows.length;

    for (const rec of rows) {
      let p = byId.get(rec.id);
      if (!p) {
        p = { id: rec.id, images: [], variants: new Map() };
        byId.set(rec.id, p);
      }

      setIfEmpty(p, 'name', rec.name);
      setIfEmpty(p, 'sku', rec.sku);
      setIfEmpty(p, 'categoryRaw', rec.categoryRaw);

      // deskripsi paling lengkap yang menang
      if (rec.description && (!p.description || rec.description.length > p.description.length)) {
        p.description = rec.description;
      }

      for (const key of ['sold', 'weightGram', 'length', 'width', 'height', 'shipDays', 'shipDaysNonPreorder']) {
        setIfEmpty(p, key, rec[key]);
      }

      // gambar: cover dulu, lalu ps_item_image.1..8 sesuai urutan
      const pics = [
        rec.coverImage,
        ...Object.keys(rec)
          .filter((k) => k.startsWith('image:'))
          .sort((a, b) => Number(a.split(':')[1]) - Number(b.split(':')[1]))
          .map((k) => rec[k]),
      ];
      for (const url of pics) {
        if (url && /^https?:\/\//i.test(url) && !p.images.includes(url)) p.images.push(url);
      }

      // baris variasi (satu produk bisa punya banyak baris variasi)
      if (rec.variationId) {
        const v = p.variants.get(rec.variationId) ?? { id: rec.variationId };
        setIfEmpty(v, 'name', rec.variationName);
        setIfEmpty(v, 'sku', rec.variationSku);
        setIfEmpty(v, 'image', rec.variationImage);
        if (rec.variationPrice) v.price = toNumber(rec.variationPrice);
        if (rec.variationStock !== undefined) v.stock = toInt(rec.variationStock);
        p.variants.set(rec.variationId, v);
      }
    }
  }

  /* -------- bentuk akhir -------- */
  const usedSlugs = new Set();
  const products = [];

  for (const p of byId.values()) {
    const name = clean(p.name) || `Produk ${p.id}`;

    let slug = slugify(name);
    if (usedSlugs.has(slug)) {
      let i = 2;
      while (usedSlugs.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }
    usedSlugs.add(slug);

    const rawVariants = [...p.variants.values()];
    const prices = rawVariants
      .map((v) => v.price)
      .filter((n) => typeof n === 'number' && n > 0);

    const price = prices.length ? Math.min(...prices) : 0;
    const priceMax = prices.length ? Math.max(...prices) : 0;
    const stock = rawVariants.reduce((sum, v) => sum + (v.stock ?? 0), 0);

    // Produk tanpa variasi asli tetap punya satu baris variasi di export Shopee.
    // Kalau namanya kosong, perlakukan sebagai produk polos.
    const isSimple = rawVariants.length <= 1 && !clean(rawVariants[0]?.name);
    const variants = isSimple
      ? []
      : rawVariants.map((v, i) => ({
          id: v.id,
          name: clean(v.name) || `Varian ${i + 1}`,
          sku: v.sku ?? '',
          price: typeof v.price === 'number' && v.price > 0 ? v.price : price,
          stock: v.stock ?? 0,
          image: v.image && /^https?:\/\//i.test(v.image) ? v.image : null,
        }));

    const description = cleanDescription(p.description);

    products.push({
      id: p.id,
      slug,
      name,
      sku: p.sku ?? '',
      description,
      excerpt: excerpt(description || name),
      price,
      priceMax,
      hasPriceRange: priceMax > price,
      stock,
      inStock: stock > 0,
      category: parseCategory(p.categoryRaw),
      images: p.images,
      variants,
      sold: toInt(p.sold) ?? 0,
      weightGram: toInt(p.weightGram) ?? null,
      dimensions: {
        length: toInt(p.length) ?? null,
        width: toInt(p.width) ?? null,
        height: toInt(p.height) ?? null,
      },
      shipDays: toInt(p.shipDays) ?? toInt(p.shipDaysNonPreorder) ?? null,
    });
  }

  // stok dulu, lalu harga tertinggi
  products.sort((a, b) => Number(b.inStock) - Number(a.inStock) || b.price - a.price);

  const categories = [];
  const seen = new Map();
  for (const p of products) {
    const c = p.category;
    if (!seen.has(c.slug)) {
      const entry = { slug: c.slug, name: c.name, count: 0 };
      seen.set(c.slug, entry);
      categories.push(entry);
    }
    seen.get(c.slug).count++;
  }
  categories.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  let imageFailures = 0;
  if (DOWNLOAD_IMAGES) {
    ({ failed: imageFailures } = await downloadAllImages(products));
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: { files: files.map((f) => path.basename(f)), rows: rowCount },
    categories,
    products,
  };

  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  const noImage = products.filter((p) => !p.images.length).length;
  const noPrice = products.filter((p) => !p.price).length;

  console.log(`\nOK: ${products.length} produk, ${categories.length} kategori -> ${path.relative(ROOT, OUT_FILE)}`);
  if (noImage) console.log(`  ! ${noImage} produk tanpa gambar`);
  if (noPrice) console.log(`  ! ${noPrice} produk tanpa harga`);
  if (imageFailures) console.log(`  ! ${imageFailures} gambar gagal diunduh (tetap pakai URL Shopee)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
