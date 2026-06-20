import { useState, useMemo } from 'react'
import ModeHeader from '../components/ModeHeader'
import KpiCard from '../components/KpiCard'
import ResearchMap from '../components/ResearchMap'
import TrendChart from '../components/TrendChart'
import LocationCompareChart from '../components/LocationCompareChart'
import DataTable from '../components/DataTable'
import { useSummary, useLocations, useMonthlyTimeseries } from '../lib/useData'
import { getStatusByLabel } from '../lib/status'
import './ResearchMode.css'

const ALL_LOCATIONS = ['Waigeo', 'Batanta', 'Misool', 'Salawati']
const METRICS = [
  { key: 'sst', label: 'SST' },
  { key: 'sst_anomaly', label: 'SST anomaly' },
  { key: 'dhw', label: 'DHW' },
]

export default function ResearchMode() {
  const { data: summary } = useSummary()
  const { data: locations } = useLocations()
  const { data: monthly } = useMonthlyTimeseries()

  const [activeLocations, setActiveLocations] = useState(ALL_LOCATIONS)
  const [metric, setMetric] = useState('dhw')
  const [yearRange, setYearRange] = useState([2010, 2025])

  const fromDate = `${yearRange[0]}-01`
  const toDate = `${yearRange[1]}-12`

  const toggleLocation = (loc) => {
    setActiveLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    )
  }

  const kpis = useMemo(() => {
    if (!summary) return null
    const entries = Object.entries(summary)
    const avgSst = entries.reduce((s, [, v]) => s + v.sst, 0) / entries.length
    const maxAnomaly = Math.max(...entries.map(([, v]) => v.sst_anomaly))
    const maxDhw = Math.max(...entries.map(([, v]) => v.dhw))
    const worst = entries.map(([n, v]) => ({ n, ...v })).sort((a, b) => b.dhw - a.dhw)[0]
    const worstStatus = getStatusByLabel(worst.status)
    return { avgSst, maxAnomaly, maxDhw, worst, worstStatus }
  }, [summary])

  if (!summary || !locations || !kpis) {
    return (
      <div className="rm">
        <ModeHeader mode="peneliti" />
        <div className="rm-loading">Memuat data oseanografi&hellip;</div>
      </div>
    )
  }

  return (
    <div className="rm">
      <ModeHeader mode="peneliti" />

      <main className="rm-main">
        <div className="rm-toolbar">
          <div>
            <h1 className="rm-title">Raja Ampat coral heat stress dashboard</h1>
            <p className="rm-subtitle">Pemantauan risiko pemutihan karang akibat tekanan panas laut, 2010&ndash;2025</p>
          </div>
          <div className="rm-toolbar-controls">
            <div className="rm-year-filter">
              <span>{yearRange[0]}</span>
              <input
                type="range" min="2010" max="2025" value={yearRange[0]}
                onChange={e => setYearRange([Math.min(+e.target.value, yearRange[1]), yearRange[1]])}
              />
              <input
                type="range" min="2010" max="2025" value={yearRange[1]}
                onChange={e => setYearRange([yearRange[0], Math.max(+e.target.value, yearRange[0])])}
              />
              <span>{yearRange[1]}</span>
            </div>
          </div>
        </div>

        <section className="rm-kpi-grid">
          <KpiCard label="SST rata-rata (semua lokasi)" value={kpis.avgSst.toFixed(1)} unit="°C" />
          <KpiCard label="SST anomaly maksimum" value={`${kpis.maxAnomaly > 0 ? '+' : ''}${kpis.maxAnomaly.toFixed(1)}`} unit="°C" accent="var(--c-coral-warning)" />
          <KpiCard label="DHW maksimum" value={kpis.maxDhw.toFixed(1)} unit="°C-wk" accent="var(--c-coral-alert)" sub={`Tertinggi di ${kpis.worst.n}`} />
          <KpiCard label="Status risiko terburuk" value={kpis.worstStatus.label} unit="" accent={kpis.worstStatus.color} sub={kpis.worst.n} />
        </section>

        <section className="rm-split">
          <div className="rm-panel rm-panel-map">
            <p className="rm-panel-title">Peta interaktif Raja Ampat</p>
            <ResearchMap locations={Object.entries(summary)} />
          </div>
          <div className="rm-panel">
            <div className="rm-trend-head">
              <p className="rm-panel-title">Tren {METRICS.find(m => m.key === metric).label} 2010&ndash;2025</p>
              <div className="rm-metric-tabs">
                {METRICS.map(m => (
                  <button
                    key={m.key}
                    className={`rm-tab ${metric === m.key ? 'active' : ''}`}
                    onClick={() => setMetric(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart
              monthly={monthly}
              locations={activeLocations}
              metric={metric}
              fromDate={fromDate}
              toDate={toDate}
            />
            <div className="rm-loc-filter">
              {ALL_LOCATIONS.map(loc => (
                <button
                  key={loc}
                  className={`rm-loc-chip ${activeLocations.includes(loc) ? 'active' : ''}`}
                  onClick={() => toggleLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rm-panel">
          <p className="rm-panel-title">SST, SST anomaly, dan DHW per lokasi (snapshot terkini)</p>
          <LocationCompareChart summary={summary} />
        </section>

        <section>
          <DataTable summary={summary} />
        </section>
      </main>

      <footer className="rm-footer">
        Sumber data: NOAA Coral Reef Watch &middot; Parameter: SST, SST Anomaly, DHW, Bleaching Alert &middot; Kelompok Kabaja, Program Studi Oseanografi ITB
      </footer>
    </div>
  )
}
