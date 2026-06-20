"""
Ekstraksi data NOAA Coral Reef Watch (NetCDF) -> JSON untuk dashboard.

Menggantikan data/generate_synthetic_data.py setelah kamu konfirmasi struktur
file asli. Output JSON skemanya SAMA PERSIS dengan generator sintetis:
  - locations.json
  - summary.json          (snapshot terbaru per lokasi)
  - monthly_timeseries.json
  - daily_timeseries.json (opsional, kalau ada data harian)

CARA PAKAI (akan disesuaikan setelah konfirmasi nama/struktur file):
  python3 extract_netcdf.py --input-dir /path/ke/folder/nc --output-dir ../app/public/data

CATATAN PENTING (ditemukan saat inspeksi file contoh):
  - Variabel 'mask' di file NOAA CRW: 0=valid-water, 1=land, 2=missing, 4=ice
    (PERHATIKAN: ini text-attribute 'flag_meanings', urutannya harus dibaca
    berpasangan dengan 'flag_values', jangan diasumsikan 0=darat seperti
    intuisi umum)
  - Resolusi 5km terlalu kasar untuk pesisir Raja Ampat yang berlekuk - titik
    koordinat pulau sering jatuh di piksel darat. Solusi: cari piksel air
    laut valid terdekat dalam radius pencarian (default 15 piksel ~75km)
  - _FillValue umum: 251 atau -999, selalu dicek dari atribut file langsung
    (jangan di-hardcode) karena bisa beda antar produk
"""

import argparse
import glob
import json
import os
import re
from collections import defaultdict

import numpy as np
import xarray as xr

LOCATIONS = {
    "Waigeo":   {"lat": -0.36, "lon": 130.82, "coral_cover": "Tinggi"},
    "Batanta":  {"lat": -0.85, "lon": 130.65, "coral_cover": "Sedang"},
    "Misool":   {"lat": -1.95, "lon": 130.18, "coral_cover": "Sedang-Tinggi"},
    "Salawati": {"lat": -1.05, "lon": 130.83, "coral_cover": "Sedang"},
}

# Pola nama variabel data per jenis produk NOAA CRW (akan disesuaikan
# kalau nama variabel aktual berbeda - cek dengan inspect_netcdf.py dulu)
VARIABLE_BY_PRODUCT = {
    "sst-mean": "sea_surface_temperature",
    "ssta": "sea_surface_temperature_anomaly",
    "dhw": "degree_heating_week",
    "baa-max": "bleaching_alert_area",
}

BAA_LABELS = {
    0: "Normal",
    1: "Watch",
    2: "Warning",
    3: "Alert Level 1",
    4: "Alert Level 2",
}


def find_nearest_water_pixel(data_2d, mask_2d, fill_value, iy, ix, max_radius=15):
    """
    Cari piksel air laut (mask==0) dengan nilai valid (!=fill_value) terdekat
    dari titik (iy, ix). Mengembalikan (value, jarak_piksel) atau (None, None)
    kalau tidak ditemukan dalam radius maksimum.
    """
    val = data_2d[iy, ix]
    if mask_2d[iy, ix] == 0 and val != fill_value and not np.isnan(val):
        return val, 0

    ny, nx = data_2d.shape
    for r in range(1, max_radius + 1):
        y0, y1 = max(0, iy - r), min(ny, iy + r + 1)
        x0, x1 = max(0, ix - r), min(nx, ix + r + 1)
        window_data = data_2d[y0:y1, x0:x1]
        window_mask = mask_2d[y0:y1, x0:x1]
        valid = (window_mask == 0) & (window_data != fill_value) & ~np.isnan(window_data)
        if valid.any():
            # ambil nilai rata-rata piksel air valid di cincin terluar window ini
            return float(window_data[valid].mean()), r
    return None, None


def parse_date_from_filename(filename):
    """Ekstrak tahun-bulan dari nama file pola ct5km_<produk>_v3.1_YYYYMM.nc"""
    m = re.search(r'(\d{4})(\d{2})', filename)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return None


def detect_product(filename):
    for key in VARIABLE_BY_PRODUCT:
        if key in filename:
            return key
    return None


def extract_one_file(filepath, product_key):
    """Ekstrak nilai per lokasi dari satu file NetCDF bulanan."""
    var_name = VARIABLE_BY_PRODUCT[product_key]
    ds = xr.open_dataset(filepath, decode_cf=False, mask_and_scale=False)

    if var_name not in ds.variables:
        available = list(ds.data_vars)
        raise KeyError(
            f"Variabel '{var_name}' tidak ditemukan di {filepath}. "
            f"Variabel yang tersedia: {available}"
        )

    lat = ds['lat'].values
    lon = ds['lon'].values
    data = ds[var_name].values
    mask = ds['mask'].values

    # squeeze dimensi time kalau ada (umumnya shape (1, lat, lon))
    if data.ndim == 3:
        data = data[0]
    if mask.ndim == 3:
        mask = mask[0]

    fill_value = ds[var_name].attrs.get('_FillValue', 251)
    scale_factor = ds[var_name].attrs.get('scale_factor', 1.0)
    add_offset = ds[var_name].attrs.get('add_offset', 0.0)

    results = {}
    for name, loc in LOCATIONS.items():
        iy = int(np.argmin(np.abs(lat - loc['lat'])))
        ix = int(np.argmin(np.abs(lon - loc['lon'])))
        raw_val, dist = find_nearest_water_pixel(data, mask, fill_value, iy, ix)
        if raw_val is None:
            results[name] = None
            continue
        # terapkan scale/offset kalau ada (umum di data NetCDF terkompresi)
        value = raw_val * scale_factor + add_offset
        results[name] = round(float(value), 3)

    ds.close()
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input-dir', required=True, help='Folder berisi file .nc')
    parser.add_argument('--output-dir', default='../app/public/data')
    args = parser.parse_args()

    files = sorted(glob.glob(os.path.join(args.input_dir, '*.nc')))
    print(f"Ditemukan {len(files)} file .nc")

    # monthly[product][location] = [{date, value}, ...]
    monthly_raw = defaultdict(lambda: defaultdict(list))

    for fp in files:
        fname = os.path.basename(fp)
        product = detect_product(fname)
        date_key = parse_date_from_filename(fname)
        if product is None or date_key is None:
            print(f"  [lewati] tidak dikenali: {fname}")
            continue
        try:
            values = extract_one_file(fp, product)
        except KeyError as e:
            print(f"  [error] {e}")
            continue
        for loc, val in values.items():
            monthly_raw[product][loc].append({"date": date_key, "value": val})
        print(f"  [ok] {fname} -> {product} {date_key}")

    # === Susun ulang jadi skema dashboard ===
    all_dates = set()
    for product_data in monthly_raw.values():
        for series in product_data.values():
            all_dates.update(p["date"] for p in series)
    all_dates = sorted(all_dates)

    monthly_timeseries = {}
    for loc in LOCATIONS:
        rows = []
        for date in all_dates:
            row = {"date": date}
            sst = next((p["value"] for p in monthly_raw.get("sst-mean", {}).get(loc, []) if p["date"] == date), None)
            ssta = next((p["value"] for p in monthly_raw.get("ssta", {}).get(loc, []) if p["date"] == date), None)
            dhw = next((p["value"] for p in monthly_raw.get("dhw", {}).get(loc, []) if p["date"] == date), None)
            row["sst"] = sst
            row["sst_anomaly"] = ssta
            row["dhw"] = dhw
            rows.append(row)
        monthly_timeseries[loc] = rows

    # summary.json = snapshot bulan terakhir yang punya data lengkap
    summary = {}
    for loc in LOCATIONS:
        series = monthly_timeseries[loc]
        valid = [r for r in series if r["dhw"] is not None]
        latest = valid[-1] if valid else (series[-1] if series else {})
        dhw_val = latest.get("dhw") or 0
        status = next((BAA_LABELS[k] for k in sorted(BAA_LABELS, reverse=True)
                       if dhw_val >= [0, 4, 8, 12, 16][k]), "Normal")
        summary[loc] = {
            **LOCATIONS[loc],
            "sst": latest.get("sst"),
            "sst_anomaly": latest.get("sst_anomaly"),
            "dhw": dhw_val,
            "status": status,
            "last_update": latest.get("date"),
        }

    os.makedirs(args.output_dir, exist_ok=True)
    with open(os.path.join(args.output_dir, "locations.json"), "w") as f:
        json.dump(LOCATIONS, f, indent=2)
    with open(os.path.join(args.output_dir, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(args.output_dir, "monthly_timeseries.json"), "w") as f:
        json.dump(monthly_timeseries, f, indent=2)

    print(f"\nSelesai. {len(all_dates)} bulan diproses -> {args.output_dir}")


if __name__ == "__main__":
    main()
