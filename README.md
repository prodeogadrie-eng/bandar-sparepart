# Toko Online — katalog dari export Shopee

Website e-commerce: katalog produk berasal dari file export Shopee (.xlsx),
bisa ditambah/diedit sendiri lewat halaman admin, dan checkout dilakukan lewat
WhatsApp. Tanpa database — data admin disimpan di Netlify Blobs.

Stack: **Next.js 16 (App Router) + Tailwind CSS 4 + TypeScript**.

---

## 1. Yang perlu kamu ganti

Semua ada di **`site.config.ts`**:

| Bagian | Isi |
| --- | --- |
| `brand` | Nama toko, file logo, tagline, deskripsi, domain |
| `whatsapp.number` | Nomor WA admin (`0851...` atau `62851...`) |
| `colors` | Warna tema. Ganti hex-nya, seluruh halaman ikut berubah |
| `contact` | Email, alamat, jam buka, Instagram, link Shopee |
| `catalog.featuredSlugs` | Produk unggulan di halaman depan (kosong = otomatis) |
| `home` | Judul & teks di halaman depan |

### Mengganti logo

Timpa **`public/logo.png`** (PNG persegi, latar transparan), lalu:

```bash
npm run icon
```

Perintah itu membuat ulang `src/app/icon.png` (64×64) yang dipakai Next.js sebagai
favicon. Logo di header dan footer otomatis ikut berubah.

### Warna

Palet bawaan diambil dari logo Bandar Sparepart:

| Token | Hex | Dipakai untuk |
| --- | --- | --- |
| `brand` | `#0E6B55` | Tombol utama, harga, link, chip kategori aktif |
| `accent` | `#F26A05` | Badge sisa stok, garis footer, penanda kecil |
| `ink` | `#111C1E` | Teks utama & latar footer |

Kalau mau **oranye** yang jadi warna tombol (bukan hijau), tukar saja nilai `brand`
dengan `accent` dan `brandSoft` dengan `accentSoft` di `site.config.ts`.

---

## 2. Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
```

Build produksi:

```bash
npm run build
npm run start
```

---

## 3. Update katalog dari Shopee

1. Export produk dari Seller Centre Shopee (Mass Update: *basic info*, *sales info*,
   *media info*, *shipping info*, *dts info* — boleh sebagian saja).
2. Taruh file `.xlsx`-nya di **`data/shopee/`** (file lama boleh ditimpa/dihapus).
3. Jalankan:

```bash
npm run import
```

Hasilnya `data/products.json` diperbarui dan gambar produk diunduh ke `public/produk/`.
Setelah itu jalankan `npm run build` lagi.

Opsi lain:

```bash
npm run import -- "D:\folder\export"   # baca dari folder lain
npm run import -- --no-download        # pakai URL gambar Shopee, tidak diunduh
```

### Yang dibereskan importer secara otomatis

- Header teknis Shopee dicari otomatis (posisinya beda-beda tiap file), baris
  meta dan baris instruksi dibuang.
- Data dari 6 file digabung per **Kode Produk**.
- Baris variasi dikumpulkan jadi array `variants`; produk tanpa variasi asli
  tetap dapat harga & stok yang benar.
- Harga & stok dijadikan angka; harga produk = varian termurah, stok = total varian.
- Kategori Shopee (`101457 - Automobiles/Automobile Spare Parts/Others`) dipendekkan
  jadi label yang layak tampil (`Automobile Spare Parts`) + slug.
- Deskripsi Shopee yang kalimatnya nempel tanpa baris baru dipecah lagi.
- Gambar cover + foto 1–8 digabung, duplikat dibuang, lalu diunduh ke `public/produk/`.

---

## 4. Halaman admin

Buka **`/admin`** (mis. https://bandarsparepart.netlify.app/admin) untuk menambah
dan mengedit produk langsung dari browser, tanpa menyentuh file.

### Mengaktifkan (sekali saja)

Halaman admin **terkunci total** sampai kamu memasang password. Password tidak
pernah ditulis di dalam kode:

1. Buka dashboard Netlify -> pilih situsnya
2. **Site configuration -> Environment variables -> Add a variable**
3. Key: `ADMIN_PASSWORD`, Value: password pilihanmu
4. Deploy ulang supaya variabel terbaca fungsi servernya

Untuk mencoba di komputer sendiri, buat file `.env.local` (tidak ikut Git):

```
ADMIN_PASSWORD=passwordpilihanmu
```

### Apa yang bisa dilakukan

| Aksi | Berlaku untuk | Catatan |
| --- | --- | --- |
| Tambah produk | produk sendiri | Tidak ada di Shopee; aman dari import ulang |
| Edit | semua produk | Editan produk Shopee disimpan sebagai lapisan terpisah |
| Sembunyikan | semua produk | Hilang dari toko, halamannya jadi 404 |
| Hapus | produk sendiri saja | Produk Shopee akan muncul lagi tiap import — pakai Sembunyikan |
| Reset | produk Shopee yang diedit | Buang editan, kembali ke data asli Shopee |

Perubahan **langsung tampil** di toko tanpa deploy ulang.

### Foto

Foto yang diunggah otomatis dikecilkan ke maksimal 1400 px dan dikonversi ke
WebP (contoh nyata: 301 KB -> 54 KB), lalu disimpan di **Netlify Blobs** —
sudah termasuk di runtime Next.js Netlify, tanpa layanan atau biaya tambahan.
Foto yang tidak lagi dipakai produk mana pun ikut terhapus sendiri.

Batas per foto 8 MB. Foto tidak bisa ditaruh di `public/` karena situs yang
sudah di-deploy tidak bisa menulis file ke dirinya sendiri.

### Di mana datanya

| Sumber | Lokasi | Ditimpa `npm run import`? |
| --- | --- | --- |
| Hasil export Shopee | `data/products.json` | **Ya, seluruhnya** |
| Editan manual (file) | `data/overrides.json` | Tidak |
| Produk & editan dari admin | Netlify Blobs (`catalog.json`) | Tidak |
| Foto unggahan | Netlify Blobs (`media/`) | Tidak |

Saat dijalankan di komputer sendiri, dua baris Blobs itu jatuh ke folder
`data/admin/` supaya `npm run dev` tetap bisa dipakai.

---

## 5. Struktur

```
site.config.ts             <- SATU-SATUNYA file konfigurasi tampilan
public/logo.png            <- logo toko
src/app/icon.png           <- favicon (hasil `npm run icon`)

data/shopee/*.xlsx         <- sumber export Shopee
data/products.json         <- hasil import (JANGAN diedit manual, selalu ditimpa)
data/overrides.json        <- editan manual lewat file (tidak pernah ditimpa)
data/admin/                <- penyimpanan admin saat dijalankan lokal
public/produk/             <- foto produk hasil unduhan dari Shopee

scripts/import-shopee.mjs  <- importer Shopee (tanpa dependency)
scripts/make-icon.mjs      <- pembuat favicon dari logo

src/app/
  layout.tsx               <- kerangka dokumen + tema warna
  (toko)/                  <- halaman yang dilihat pembeli
    layout.tsx             <-   header, footer, tombol WhatsApp, keranjang
    page.tsx               <-   Home
    produk/page.tsx        <-   Katalog + search + filter kategori
    produk/[slug]/page.tsx <-   Detail produk
    keranjang/page.tsx     <-   Keranjang
    checkout/page.tsx      <-   Checkout via WhatsApp
  admin/                   <- panel admin (terkunci password)
    login/                 <-   halaman masuk
    (panel)/               <-   daftar produk + formulir tambah/edit
    actions.ts             <-   semua aksi yang menulis data
  media/[key]/route.ts     <- penyaji foto unggahan dari Blobs

src/components/            <- komponen UI
src/lib/
  catalog.ts               <- perakit katalog: Shopee + admin, di-cache
  shopee-source.ts         <-   data hasil import (dibaca saat build)
  overrides.ts             <-   lapisan editan di atas data Shopee
  admin-data.ts, store.ts  <-   baca/tulis penyimpanan admin
  auth.ts                  <-   penjaga halaman admin
  image.ts                 <-   pengecil foto unggahan
  search.ts                <-   pencarian katalog (ikut ke browser)
  whatsapp.ts, format.ts   <-   pesan WhatsApp & format rupiah
```

Keranjang disimpan di `localStorage` browser pembeli — tidak ada data yang
dikirim ke server.

---

## 6. Deploy

Situs ini sudah live di Netlify. Untuk deploy ulang dari komputer:

```bash
npx netlify-cli deploy --build --prod
```

Environment variable yang perlu diisi di dashboard Netlify:

| Variable | Untuk apa | Wajib? |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Membuka halaman `/admin` | Ya, kalau mau pakai admin |

Halaman toko tetap di-*prerender* jadi HTML statis (cepat), dan hanya dibuat
ulang ketika kamu menyimpan sesuatu di admin.

Setelah punya domain, isi `brand.url` di `site.config.ts` supaya link produk ikut
masuk ke pesan WhatsApp dan metadata SEO-nya benar.
