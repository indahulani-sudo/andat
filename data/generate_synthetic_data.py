"""
Generator data sintetis untuk Coral Heat Stress Dashboard - Raja Ampat.

TUJUAN: Membangun struktur data realistis (SST, SST Anomaly, DHW, Bleaching
Alert) selama 2010-2025 di 4 lokasi (Waigeo, Batanta, Misool, Salawati)
sebagai placeholder, SAMPAI data asli hasil ekstraksi NetCDF NOAA Coral Reef
Watch siap dipakai.

CARA MENGGANTI DENGAN DATA ASLI NANTI:
Skrip extract_netcdf.py (dibuat terpisah) akan menghasilkan file JSON dengan
SKEMA IDENTIK dengan yang dihasilkan skrip ini:
  - daily_timeseries.json : {lokasi: [{date, sst, sst_anomaly, dhw}, ...]}
  - locations.json        : metadata 4 lokasi
  - summary.json          : agregat KPI per lokasi (current snapshot)
Selama skema ini dipertahankan, React app tidak perlu diubah sama sekali.
"""

import json
import math
import random
from datetime import date, timedelta

random.seed(42)

LOCATIONS = {
    "Waigeo":   {"lat": -0.36, "lon": 130.82, "coral_cover": "Tinggi"},
    "Batanta":  {"lat": -0.85, "lon": 130.65, "coral_cover": "Sedang"},
    "Misool":   {"lat": -1.95, "lon": 130.18, "coral_cover": "Sedang-Tinggi"},
    "Salawati": {"lat": -1.05, "lon": 130.83, "coral_cover": "Sedang"},
}

# Baseline klimatologi per lokasi (rata-rata historis, sedikit beda tiap pulau)
BASELINE_SST = {
    "Waigeo": 29.4,
    "Batanta": 29.6,
    "Misool": 29.3,
    "Salawati": 29.5,
}

# Tahun-tahun dengan event El Nino / marine heatwave signifikan (mempengaruhi anomaly)
HEAT_EVENT_YEARS = {
    2010: 0.3, 2015: 1.4, 2016: 1.6, 2019: 0.9,
    2020: 0.5, 2023: 1.3, 2024: 1.7, 2025: 1.1,
}

START = date(2010, 1, 1)
END = date(2025, 12, 31)


def seasonal_cycle(day_of_year: int) -> float:
    """Variasi musiman sederhana: puncak panas sekitar Sep-Nov (musim kemarau)."""
    return 0.55 * math.sin(2 * math.pi * (day_of_year - 60) / 365)


def warming_trend(year: int) -> float:
    """Tren pemanasan jangka panjang ~0.02 C/tahun sejak 2010."""
    return (year - 2010) * 0.025


def compute_dhw(anomaly_history: list[float]) -> float:
    """
    DHW (Degree Heating Weeks) versi sederhana: akumulasi anomaly > 1.0C
    selama 12 minggu terakhir (didekati dari deret harian), dibagi 7.
    Ini adalah pendekatan, bukan formula NOAA CRW yang presisi.
    """
    hotspot_sum = sum(max(0.0, a - 1.0) for a in anomaly_history[-84:])
    return round(hotspot_sum / 7, 2)


def bleaching_status(dhw: float) -> str:
    if dhw >= 16:
        return "Alert Level 2"
    if dhw >= 12:
        return "Alert Level 1"
    if dhw >= 8:
        return "Warning"
    if dhw >= 4:
        return "Watch"
    return "Normal"


def generate_location_series(loc_name: str) -> list[dict]:
    base = BASELINE_SST[loc_name]
    series = []
    anomaly_hist: list[float] = []
    d = START
    # noise persisten ringan (random walk kecil) supaya tidak jaggy
    drift = 0.0
    while d <= END:
        doy = d.timetuple().tm_yday
        event_boost = HEAT_EVENT_YEARS.get(d.year, 0.0)
        # event memuncak pertengahan tahun ke akhir tahun
        month_weight = 1.0 if d.month >= 6 else 0.4

        drift += random.gauss(0, 0.03)
        drift = max(-0.4, min(0.4, drift))

        noise = random.gauss(0, 0.18)
        anomaly = (
            event_boost * month_weight
            + warming_trend(d.year)
            + drift
            + noise
        )
        anomaly = round(anomaly, 2)
        sst = round(base + seasonal_cycle(doy) + anomaly, 2)

        anomaly_hist.append(anomaly)
        dhw = compute_dhw(anomaly_hist)
        status = bleaching_status(dhw)

        series.append({
            "date": d.isoformat(),
            "sst": sst,
            "sst_anomaly": anomaly,
            "dhw": dhw,
            "status": status,
        })
        d += timedelta(days=1)
    return series


def main():
    all_series = {}
    summary = {}

    for loc in LOCATIONS:
        series = generate_location_series(loc)
        all_series[loc] = series
        latest = series[-1]
        sst_values_last_year = [p["sst"] for p in series[-365:]]
        summary[loc] = {
            **LOCATIONS[loc],
            "sst": latest["sst"],
            "sst_anomaly": latest["sst_anomaly"],
            "dhw": latest["dhw"],
            "status": latest["status"],
            "sst_avg_1y": round(sum(sst_values_last_year) / len(sst_values_last_year), 2),
            "last_update": latest["date"],
        }

    with open("locations.json", "w") as f:
        json.dump(LOCATIONS, f, indent=2)

    with open("summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    # Simpan time series harian penuh (untuk eksplorasi mode peneliti)
    with open("daily_timeseries.json", "w") as f:
        json.dump(all_series, f)

    # Versi bulanan (agregat) - lebih ringan, dipakai untuk grafik tren panjang
    monthly = {}
    for loc, series in all_series.items():
        agg = {}
        for p in series:
            key = p["date"][:7]
            agg.setdefault(key, {"sst": [], "sst_anomaly": [], "dhw": []})
            agg[key]["sst"].append(p["sst"])
            agg[key]["sst_anomaly"].append(p["sst_anomaly"])
            agg[key]["dhw"].append(p["dhw"])
        monthly[loc] = [
            {
                "date": k,
                "sst": round(sum(v["sst"]) / len(v["sst"]), 2),
                "sst_anomaly": round(sum(v["sst_anomaly"]) / len(v["sst_anomaly"]), 2),
                "dhw": round(max(v["dhw"]), 2),
            }
            for k, v in sorted(agg.items())
        ]
    with open("monthly_timeseries.json", "w") as f:
        json.dump(monthly, f, indent=2)

    print("Selesai. File dihasilkan:")
    print(" - locations.json")
    print(" - summary.json")
    print(f" - daily_timeseries.json ({sum(len(v) for v in all_series.values())} total titik harian)")
    print(f" - monthly_timeseries.json ({sum(len(v) for v in monthly.values())} total titik bulanan)")


if __name__ == "__main__":
    main()
