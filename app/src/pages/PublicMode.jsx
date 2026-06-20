import { useState, useMemo } from 'react'
import ModeHeader from '../components/ModeHeader'
import { useSummary, useMonthlyTimeseries } from '../lib/useData'
import { getStatusByLabel, STATUS_SCALE } from '../lib/status'
import PublicMap from '../components/PublicMap'
import PublicTrendStrip from '../components/PublicTrendStrip'
import './PublicMode.css'

const ISLAND_DESC = {
  Waigeo: 'Pulau terbesar di Raja Ampat dengan tutupan karang tinggi, rumah bagi banyak titik selam populer.',
  Batanta: 'Berbatasan langsung dengan jalur arus laut dalam, cukup sensitif terhadap kenaikan suhu musiman.',
  Misool: 'Kawasan konservasi laut dengan keanekaragaman hayati tertinggi di Raja Ampat.',
  Salawati: 'Berdekatan dengan Sorong, mengalami tekanan dari aktivitas pesisir maupun suhu laut.',
}

export default function PublicMode() {
  const { data: summary } = useSummary()
  const { data: monthly } = useMonthlyTimeseries()
  const [selected, setSelected] = useState(null)

  const locations = useMemo(() => summary ? Object.entries(summary) : [], [summary])

  const overall = useMemo(() => {
    if (!locations.length) return null
    const worst = locations
      .map(([name, v]) => ({ name, ...v, statusInfo: getStatusByLabel(v.status) }))
      .sort((a, b) => b.statusInfo.min - a.statusInfo.min)[0]
    const atRisk = locations.filter(([, v]) => v.dhw >= 8).length
    return { worst, atRisk, total: locations.length }
  }, [locations])

  const activeLoc = selected && summary ? { name: selected, ...summary[selected] } : null
  const activeStatus = activeLoc ? getStatusByLabel(activeLoc.status) : null

  if (!summary || !overall) {
    return (
      <div className="pm">
        <ModeHeader mode="publik" />
        <div className="pm-loading">Memuat data terumbu karang&hellip;</div>
      </div>
    )
  }

  return (
    <div className="pm">
      <ModeHeader mode="publik" />

      <main className="pm-main">
        <section
          className="pm-hero-status"
          style={{ '--s-color': overall.worst.statusInfo.color, '--s-bg': overall.worst.statusInfo.bg }}
        >
          <p className="pm-hero-eyebrow">Status terumbu karang Raja Ampat saat ini</p>
          <h1 className="pm-hero-status-text">{overall.worst.statusInfo.labelPublik}</h1>
          <p className="pm-hero-sub">
            {overall.atRisk > 0
              ? <>{overall.atRisk} dari {overall.total} pulau yang dipantau menunjukkan tanda tekanan panas tinggi.</>
              : <>Seluruh pulau yang dipantau berada dalam kondisi aman.</>}
          </p>
        </section>

        <section className="pm-section">
          <p className="pm-section-label">Peta kondisi pulau</p>
          <div className="pm-map-card">
            <PublicMap
              locations={locations}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        </section>

        <section className="pm-section pm-story">
          <p className="pm-section-label">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: '-2px', marginRight: 6 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-5M12 8h.01" />
            </svg>
            Apa yang sedang terjadi?
          </p>
          <div className="pm-story-card">
            <p>
              Suhu permukaan laut di sekitar <strong>{overall.worst.name}</strong> tercatat{' '}
              <strong>{overall.worst.sst_anomaly > 0 ? 'lebih panas' : 'lebih dingin'} {Math.abs(overall.worst.sst_anomaly).toFixed(1)}°C</strong>{' '}
              dari kondisi normal. {overall.worst.dhw >= 8
                ? 'Jika suhu setinggi ini bertahan beberapa minggu lagi, karang di sana berisiko kehilangan warnanya — kondisi yang disebut pemutihan karang (coral bleaching).'
                : 'Kondisi ini masih dalam batas yang bisa ditoleransi karang, namun tetap perlu dipantau.'}
            </p>
            <p className="pm-story-explainer">
              <strong>Kenapa ini penting?</strong> Karang yang memutih kehilangan alga
              yang menjadi sumber makanan dan warnanya. Bila stres berlangsung lama,
              karang bisa mati — mengancam ikan dan biota yang bergantung padanya.
            </p>
          </div>
        </section>

        <section className="pm-section">
          <p className="pm-section-label">Tren 12 bulan terakhir</p>
          <PublicTrendStrip monthly={monthly} locations={locations.map(([n]) => n)} />
        </section>

        <section className="pm-section">
          <p className="pm-section-label">Pilih pulau untuk melihat ceritanya</p>
          <div className="pm-island-grid">
            {locations.map(([name, v]) => {
              const st = getStatusByLabel(v.status)
              const isActive = selected === name
              return (
                <button
                  key={name}
                  className={`pm-island-chip ${isActive ? 'active' : ''}`}
                  style={{ '--s-color': st.color, '--s-bg': st.bg }}
                  onClick={() => setSelected(isActive ? null : name)}
                >
                  <span className="pm-island-dot" />
                  {name}
                </button>
              )
            })}
          </div>

          {activeLoc && (
            <div className="pm-island-detail" style={{ '--s-color': activeStatus.color, '--s-bg': activeStatus.bg }}>
              <div className="pm-island-detail-head">
                <h3>{activeLoc.name}</h3>
                <span className="pm-island-badge">{activeStatus.labelPublik}</span>
              </div>
              <p className="pm-island-desc">{ISLAND_DESC[activeLoc.name]}</p>
              <p className="pm-island-desc">{activeStatus.desc}</p>
              <div className="pm-island-facts">
                <div>
                  <p className="pm-fact-label">Tutupan karang</p>
                  <p className="pm-fact-value">{activeLoc.coral_cover}</p>
                </div>
                <div>
                  <p className="pm-fact-label">Suhu laut saat ini</p>
                  <p className="pm-fact-value">{Math.round(activeLoc.sst)}°C</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="pm-legend">
          {STATUS_SCALE.map(s => (
            <div key={s.key} className="pm-legend-item">
              <span className="pm-legend-dot" style={{ background: s.color }} />
              {s.labelPublik}
            </div>
          ))}
        </section>
      </main>

      <footer className="pm-footer">
        Sumber data: NOAA Coral Reef Watch &middot; Kelompok Kabaja, Program Studi Oseanografi ITB
      </footer>
    </div>
  )
}
