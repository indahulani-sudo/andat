import { getStatusByLabel } from '../lib/status'
import './DataTable.css'

function downloadCSV(summary) {
  const rows = Object.entries(summary)
  const header = ['Lokasi', 'Lintang', 'Bujur', 'SST (C)', 'SST Anomaly (C)', 'DHW (C-weeks)', 'Status Risiko', 'Tutupan Karang', 'Update Terakhir']
  const lines = [header.join(',')]
  rows.forEach(([name, v]) => {
    lines.push([
      name, v.lat, v.lon, v.sst, v.sst_anomaly, v.dhw, v.status, v.coral_cover, v.last_update
    ].join(','))
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'coral_heat_stress_raja_ampat.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function DataTable({ summary }) {
  const rows = Object.entries(summary)

  return (
    <div className="dt-card">
      <div className="dt-head">
        <div>
          <p className="dt-title">Tabel data monitoring</p>
          <p className="dt-sub">Ringkasan parameter oseanografi dan status risiko per lokasi</p>
        </div>
        <button className="dt-download" onClick={() => downloadCSV(summary)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" />
          </svg>
          Unduh CSV
        </button>
      </div>

      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead>
            <tr>
              <th>Lokasi</th>
              <th>Lintang</th>
              <th>Bujur</th>
              <th>SST (°C)</th>
              <th>Anomaly (°C)</th>
              <th>DHW</th>
              <th>Status</th>
              <th>Tutupan karang</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, v]) => {
              const status = getStatusByLabel(v.status)
              return (
                <tr key={name}>
                  <td className="dt-loc">{name}</td>
                  <td className="mono">{v.lat.toFixed(2)}</td>
                  <td className="mono">{v.lon.toFixed(2)}</td>
                  <td className="mono">{v.sst.toFixed(1)}</td>
                  <td className="mono">{v.sst_anomaly > 0 ? '+' : ''}{v.sst_anomaly.toFixed(1)}</td>
                  <td className="mono">{v.dhw.toFixed(1)}</td>
                  <td>
                    <span className="dt-badge" style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </td>
                  <td>{v.coral_cover}</td>
                  <td className="dt-date">{v.last_update}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
