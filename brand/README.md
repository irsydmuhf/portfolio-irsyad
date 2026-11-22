# Brand kit — Irsyad Muhamad Firdaus

Logo **Pita**: huruf "i" yang batangnya menyelinap di bawah lengkungan pita, dengan titik kuning besar.
Semua file di sini dibuat dari `_source/build.mjs`, jadi ukuran dan warnanya konsisten.

## Warna

| Nama | Hex | Peran |
|---|---|---|
| Brand blue | `#3a6cf4` | Warna utama: latar, logo, tombol |
| Brand deep | `#2753d8` | Hover, bayangan |
| Sun | `#ffc935` | Titik logo, aksen. Pakai secukupnya |
| Ink | `#15171c` | Teks utama, logo satu warna |
| Muted | `#5b6275` | Teks sekunder |
| Paper | `#f5f7fc` | Latar terang |

Font: **Poppins** Bold (judul, nama) dan Medium (teks pendukung). Di website, teks panjang memakai Inter.

## Isi folder

### `logo/`
| File | Pakai untuk |
|---|---|
| `icon-rounded` | Ikon aplikasi, favicon, avatar persegi berujung bulat |
| `icon-square` | Avatar yang sudutnya dibulatkan otomatis oleh platform (GitHub, iOS) |
| `icon-circle` | Avatar bulat (WhatsApp, Discord, Google) |
| `mark-color` | Logo di atas latar putih atau terang |
| `mark-white` | Logo di atas latar biru atau gelap |
| `mark-ink` | Satu warna hitam: stempel, cetak hitam-putih, faks |
| `mark-mono-white` | Satu warna putih: di atas foto atau latar gelap |

Format SVG untuk desain dan cetak, PNG di `logo/png/`. Angka di nama file PNG mark adalah tingginya (1024 px).

### `lockup/`
Logo dan nama dalam satu kesatuan. Versi `horizontal` untuk header CV, kop surat, dan footer dokumen. Versi `stacked` untuk ruang persegi.
Pakai `-light` di atas latar terang, `-dark` di atas latar biru atau gelap (teksnya putih, latar transparan).

### `social/`
| File | Ukuran | Pakai untuk |
|---|---|---|
| `linkedin-banner` | 1584×396 | Banner profil LinkedIn. Upload versi `@2x` supaya tajam |
| `x-header` | 1500×500 | Header profil X / Twitter |
| `github-readme-banner` | 1280×320 | Bagian atas README profil GitHub |
| `og-image` | 1200×630 | Gambar pratinjau link (sama dengan yang di website) |
| `square-post-template` | 1080×1080 | Post LinkedIn atau Instagram. Area kiri atas kosong untuk teksmu |
| `story-template` | 1080×1920 | Story Instagram atau WhatsApp |

Banner LinkedIn dan X: foto profil menutupi pojok kiri bawah, jadi teks sengaja dimulai dari tengah.

### `presentation/`
- `slide-cover-bg`: latar slide judul (1920×1080). Tulis judul di area kiri atas.
- `slide-content-bg`: latar slide isi, terang, dengan nama dan URL di bawah.
- `video-call-background`: latar virtual Zoom / Google Meet. Nama di kanan atas supaya tidak tertutup badan.

### `print/`
Kartu nama 90×55 mm. PNG `@2x` setara 600 dpi.
Sebelum dicetak, tanyakan percetakan apakah mereka butuh *bleed* 3 mm. Kalau ya, perlebar latar biru di sisi belakang 3 mm ke setiap sisi.

### `email/`
`email-signature@2x.png`: tempel sebagai gambar di tanda tangan Gmail atau Outlook, lalu atur lebarnya 600 px.

## Aturan pemakaian

- Jangan ubah warna titik selain kuning, kecuali di versi satu warna (`mark-ink`, `mark-mono-white`).
- Beri ruang kosong di sekitar logo minimal selebar titik kuningnya.
- Jangan memutar, memiringkan, atau meregangkan logo. Pengecualian: aksen besar terpotong yang diputar 90° seperti di kartu nama belakang.
- Logo terpotong di tepi hanya untuk aksen latar. Untuk identitas utama, pakai logo utuh.

## Membuat ulang

Kalau nama, jabatan, URL, atau daftar tools berubah, edit objek `INFO` di `_source/build.mjs`, lalu jalankan:

```bash
cd brand/_source
npm init -y && npm install satori@0.12.2   # sekali saja
node build.mjs
```

Script ini memakai `sharp` dan font Poppins dari proyek portofolio (`assets/fonts/`).
