import './KpiCard.css'

export default function KpiCard({ label, value, unit, accent, sub }) {
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value" style={accent ? { color: accent } : undefined}>
        {value}<span className="kpi-unit">{unit}</span>
      </p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}
