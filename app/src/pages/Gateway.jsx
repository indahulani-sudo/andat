import { useNavigate } from 'react-router-dom'
import { useSummary } from '../lib/useData'
import { getStatusByLabel } from '../lib/status'
import './Gateway.css'

export default function Gateway() {
  const navigate = useNavigate()
  const { data: summary } = useSummary()

  const locations = summary ? Object.entries(summary) : []
  const worstStatus = locations.length
    ? locations
        .map(([, v]) => getStatusByLabel(v.status))
        .sort((a, b) => b.min - a.min)[0]
    : null
  const atRiskCount = locations.filter(([, v]) => v.dhw >= 8).length

  return (
    <div className="gw">
      <div className="gw-map-layer" aria-hidden="true" />

      <header className="gw-topbar">
        <div className="gw-brand">
          <span className="gw-brand-mark">RA</span>
          <div>
            <p className="gw-brand-title">Coral Heat Stress Watch</p>
            <p className="gw-brand-sub">Kelompok Kabaja &middot; OS3201 ITB</p>
          </div>
        </div>
        <a
          className="gw-source-link"
          href="https://coralreefwatch.noaa.gov"
          target="_blank"
          rel="noreferrer"
        >
          Sumber data: NOAA Coral Reef Watch
        </a>
      </header>

      <main className="gw-hero">
        <p className="gw-eyebrow">Pemantauan risiko pemutihan karang &middot; Raja Ampat, 2010&ndash;2025</p>
        <h1 className="gw-title">
          Suhu laut sedang naik.
          <br />
          <span className="gw-title-accent">Bagaimana nasib terumbu karang Raja Ampat?</span>
        </h1>
        <p className="gw-desc">
          Dashboard ini memantau tekanan panas laut (marine heat stress) di empat
          gugusan pulau utama Raja Ampat menggunakan data satelit NOAA Coral Reef
          Watch. Pilih cara menjelajahi datanya di bawah.
        </p>

        {worstStatus && (
          <div className="gw-status-strip" style={{ '--s-color': worstStatus.color, '--s-bg': worstStatus.bg }}>
            <span className="gw-status-dot" />
            <span>
              Status terkini: <strong>{worstStatus.label}</strong> di salah satu lokasi pemantauan
              {atRiskCount > 0 && <> &middot; {atRiskCount} dari {locations.length} lokasi berisiko tinggi</>}
            </span>
          </div>
        )}
      </main>

      <section className="gw-choices" aria-label="Pilih mode dashboard">
        <button className="gw-card gw-card-public" onClick={() => navigate('/publik')}>
          <div className="gw-card-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="9" cy="7" r="3.2" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              <circle cx="17.5" cy="8" r="2.4" />
              <path d="M21 20c0-2.6-1.8-4.8-4.2-5.6" />
            </svg>
          </div>
          <p className="gw-card-eyebrow">Untuk masyarakat umum</p>
          <h2 className="gw-card-title">Mode publik</h2>
          <p className="gw-card-body">
            Status sederhana, peta yang mudah dibaca, dan cerita singkat tentang apa
            yang terjadi &mdash; tanpa istilah teknis.
          </p>
          <span className="gw-card-cta">Lihat status karang &rarr;</span>
        </button>

        <button className="gw-card gw-card-research" onClick={() => navigate('/peneliti')}>
          <div className="gw-card-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 19V9M11 19V4M18 19v-7" />
              <path d="M2 19h20" />
            </svg>
          </div>
          <p className="gw-card-eyebrow">Untuk peneliti &amp; akademisi</p>
          <h2 className="gw-card-title">Mode peneliti</h2>
          <p className="gw-card-body">
            Time-series SST, anomaly, dan DHW lengkap 2010&ndash;2025, filter per lokasi
            dan rentang waktu, serta unduh data mentah.
          </p>
          <span className="gw-card-cta">Buka data lengkap &rarr;</span>
        </button>
      </section>

      <footer className="gw-footer">
        <span>Wilayah kajian: Waigeo &middot; Batanta &middot; Misool &middot; Salawati</span>
        <span>Presentasi Rencana Tugas Akhir &middot; Program Studi Oseanografi ITB</span>
      </footer>
    </div>
  )
}
