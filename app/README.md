# Coral Heat Stress Watch — Raja Ampat

Dashboard pemantauan risiko pemutihan karang akibat marine heat stress di
Raja Ampat (2010–2025), dengan dua mode tampilan: **Publik** (untuk
masyarakat umum) dan **Peneliti** (untuk eksplorasi data akademik).

Dibangun dengan React + Vite, peta dengan Leaflet, grafik dengan Recharts.

## Menjalankan secara lokal

```bash
cd app
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Struktur proyek

```
coral-dashboard/
├── data/                       # Skrip Python pengolah data NetCDF
│   ├── generate_synthetic_data.py   # Generator data placeholder (dipakai saat ini)
│   ├── inspect_netcdf.py            # Cek struktur file .nc sebelum ekstraksi
│   └── extract_netcdf.py            # Ekstraksi NetCDF asli -> JSON dashboard
└── app/                        # Aplikasi React
    ├── public/data/            # File JSON yang dibaca dashboard (lihat di bawah)
    └── src/
        ├── pages/               # Gateway, PublicMode, ResearchMode
        ├── components/          # Peta, chart, tabel, KPI card
        └── lib/                 # Helper status risiko & data fetching
```

## Mengganti data sintetis dengan data NOAA CRW asli

Dashboard ini saat ini berjalan di atas **data sintetis** (pola musiman +
tren pemanasan + event panas yang realistis) sebagai placeholder, supaya
seluruh struktur dashboard bisa dibangun dan diuji sebelum data asli siap.

Untuk menggantinya:

1. **Cek dulu struktur file NetCDF kamu** (jangan asumsikan nama variabel):
   ```bash
   cd data
   python3 inspect_netcdf.py /path/ke/salah_satu_file.nc
   ```
   Catat nama variabel data, `_FillValue`, dan `scale_factor` yang muncul.

2. **Sesuaikan `VARIABLE_BY_PRODUCT` di `extract_netcdf.py`** kalau nama
   variabel di file kamu berbeda dari default.

3. **Jalankan ekstraksi**:
   ```bash
   python3 extract_netcdf.py --input-dir /path/ke/folder/nc --output-dir ../app/public/data
   ```

4. File `locations.json`, `summary.json`, `monthly_timeseries.json` di
   `app/public/data/` akan ter-update. **Tidak perlu mengubah kode React
   sama sekali** — skema datanya dijaga identik dengan versi sintetis.

5. Jalankan ulang `npm run dev` untuk verifikasi, lalu `npm run build`.

### Catatan teknis dari hasil inspeksi data NOAA CRW

- Variabel `mask`: `0 = valid-water`, `1 = land`, `2 = missing`, `4 = ice`
  — urutan ini mengikuti atribut `flag_meanings` di file, jangan diasumsikan.
- Resolusi native 5km kadang terlalu kasar untuk pesisir Raja Ampat yang
  berlekuk, sehingga titik koordinat pulau bisa jatuh di piksel darat.
  `extract_netcdf.py` sudah menangani ini dengan mencari piksel air laut
  valid terdekat (default radius pencarian 15 piksel ≈ 75km).
- BAA (Bleaching Alert Area) berskala kategori 0–4: 0=No Stress,
  1=Watch, 2=Warning, 3=Alert Level 1, 4=Alert Level 2.

## Build untuk produksi

```bash
cd app
npm run build
```

Hasilnya ada di `app/dist/` — folder statis siap di-deploy ke mana saja.

## Deploy ke GitHub Pages

1. Push folder `app/` ini ke repository GitHub kamu.
2. Install `gh-pages`:
   ```bash
   npm install -D gh-pages
   ```
3. Tambahkan ke `package.json`:
   ```json
   "scripts": {
     "deploy": "vite build && gh-pages -d dist"
   }
   ```
4. Jalankan:
   ```bash
   npm run deploy
   ```
5. Di pengaturan repo GitHub → **Settings → Pages**, pilih branch `gh-pages`
   sebagai source.

Aplikasi memakai `HashRouter` (URL berbentuk `#/publik`, `#/peneliti`)
supaya tidak perlu konfigurasi server tambahan di GitHub Pages — refresh
halaman di rute manapun akan tetap berfungsi.
