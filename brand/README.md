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

### `dataviz/` — warna grafik
Palet 6 warna untuk grafik, **pakai sesuai urutan** (Blue, Orange, Teal, Coral, Violet, Gold). Sudah diuji untuk buta warna dan kontras, di latar putih maupun gelap. Lihat `palette-sheet.png`.

- Grafik sebar (scatter) atau peta: maksimal 3 warna pertama. Sisanya gabungkan ke "Other".
- Mau menonjolkan satu hal? Pakai **Focus** (biru) untuk yang penting, **Rest** (abu-abu) untuk sisanya.
- Warna status (Good, Warning, Critical) hanya untuk kondisi, selalu dengan ikon atau label.

| File | Untuk |
|---|---|
| `irsyad.mplstyle` | matplotlib / seaborn: `plt.style.use("irsyad.mplstyle")` |
| `plotly-template.json` | Plotly: `pio.templates["irsyad"] = go.layout.Template(json.load(open(...)))` |
| `powerbi-theme.json` | Power BI: View → Themes → Browse for themes |
| `tableau-Preferences.tps` | Tableau: gabungkan ke `Documents/My Tableau Repository/Preferences.tps` |
| `office-theme-colors.xml` | Excel / PowerPoint: salin ke `%APPDATA%\Microsoft\Templates\Document Themes\Theme Colors\`, lalu pilih di Design → Colors |
| `palette.json`, `palette.css` | Semua nilai warna, untuk kode atau Looker Studio (isi warna manual di Theme and layout) |

### `badges/` — tech stack dan skill
- `tech/chip/`: pil putih dengan logo, 24 tools. Bisa dipakai di latar putih maupun biru.
- `tech/tile/` dan `tech/tile-labeled/`: tile logo berwarna merek dengan efek tuts 3D, sama persis dengan deretan tech stack di website. Versi `labeled` sudah berisi nama di bawahnya.
- `skills/`: pil teks, warna titik menandai kategori (Analytics biru, Data & Automation teal, BI & Reporting oranye, Data Systems violet).
- `tech-stack-sheet.png`: semua badge dalam satu gambar.

Logo diambil dari Simple Icons. Excel, Power BI, Tableau, dan AWS tidak tersedia di sana karena alasan merek dagang, jadi dibuat sebagai kotak inisial berwarna merek, sama seperti di website.

### `presentation/irsyad-slides-template.pptx`
Template 9 slide: cover, pembatas bagian, case study (masalah, pendekatan, hasil), angka KPI, grafik dengan sorotan, grafik multi-seri, cara kerja, tools dan skill, penutup dengan QR ke portofolio.
Angka dan data grafik di dalamnya **contoh**, ganti dengan milikmu.

## Pakai di Canva

1. **Brand Kit** (Canva Pro): Brand → Brand Kit → tambahkan
   - Logo: `logo/mark-color.svg`, `logo/mark-white.svg`, `logo/icon-rounded.svg`
   - Warna: Brand blue `#3a6cf4`, Sun `#ffc935`, Ink `#15171c`, Paper `#f5f7fc`, plus 6 warna grafik dari `dataviz/`
   - Font: Poppins (sudah tersedia di Canva) untuk judul dan teks
2. **Template slide:** di beranda Canva klik Upload → pilih `irsyad-slides-template.pptx`. Canva mengubahnya jadi desain yang bisa diedit.
3. **Badge dan logo:** upload file SVG. Di Canva, warna SVG masih bisa diganti.
4. **Grafik di Canva:** pakai Charts, lalu isi warna seri sesuai urutan palet.

## Aturan pemakaian

- Jangan ubah warna titik selain kuning, kecuali di versi satu warna (`mark-ink`, `mark-mono-white`).
- Beri ruang kosong di sekitar logo minimal selebar titik kuningnya.
- Jangan memutar, memiringkan, atau meregangkan logo. Pengecualian: aksen besar terpotong yang diputar 90° seperti di kartu nama belakang.
- Logo terpotong di tepi hanya untuk aksen latar. Untuk identitas utama, pakai logo utuh.

## Membuat ulang

Kalau nama, jabatan, URL, atau daftar tools berubah, edit objek `INFO` di `_source/build.mjs`, lalu jalankan:

```bash
cd brand/_source
npm init -y && npm install satori@0.12.2 pptxgenjs@3.12.0   # sekali saja
node build.mjs          # logo, lockup, sosial media, slide background, kartu nama
node build-extras.mjs   # palet grafik, badge, QR
node build-slides.cjs   # template .pptx (butuh hasil dua script di atas)
```

Daftar tools dan skill ada di `TECH` dan `SKILLS` di `build-extras.mjs`.

Script ini memakai `sharp` dan font Poppins dari proyek portofolio (`assets/fonts/`).
