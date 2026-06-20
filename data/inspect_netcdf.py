"""
Inspeksi cepat struktur sebuah file NetCDF NOAA CRW.

PAKAI INI SETIAP KALI ketemu file .nc yang jenisnya belum dikenal, sebelum
menjalankan extract_netcdf.py - supaya nama variabel & atribut fill value
dipastikan dulu, bukan ditebak.

Cara pakai:
  python3 inspect_netcdf.py /path/ke/file.nc
"""

import sys
import xarray as xr


def main():
    if len(sys.argv) < 2:
        print("Pakai: python3 inspect_netcdf.py <path_file.nc>")
        sys.exit(1)

    path = sys.argv[1]
    ds = xr.open_dataset(path, decode_cf=False, mask_and_scale=False)

    print(f"=== {path} ===\n")
    print("Dimensi:", dict(ds.sizes))
    print()
    print("Variabel data:")
    for name, var in ds.data_vars.items():
        attrs = var.attrs
        print(f"  - {name}  shape={var.shape}  dtype={var.dtype}")
        if 'long_name' in attrs:
            print(f"      long_name: {attrs['long_name']}")
        if '_FillValue' in attrs:
            print(f"      _FillValue: {attrs['_FillValue']}")
        if 'scale_factor' in attrs:
            print(f"      scale_factor: {attrs['scale_factor']}, add_offset: {attrs.get('add_offset', 0)}")
        if 'units' in attrs:
            print(f"      units: {attrs['units']}")
        if 'comment' in attrs:
            print(f"      comment: {attrs['comment'][:200]}")
    print()
    if 'time' in ds.coords:
        print("Cakupan waktu:", ds['time'].values)


if __name__ == "__main__":
    main()
