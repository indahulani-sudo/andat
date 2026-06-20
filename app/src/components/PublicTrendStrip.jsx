import { useMemo } from 'react'
import { getStatusByLabel } from '../lib/status'
import './PublicTrendStrip.css'

function Sparkline({ points, color }) {
  if (!points.length) return null
  const w = 200
  const h = 48
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = w / (points.length - 1)
  const path = points
    .map((p, i) => {
      const x = i * step
      const y = h - ((p - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="pts-svg" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PublicTrendStrip({ monthly, locations }) {
  const items = useMemo(() => {
    if (!monthly) return []
    return locations.map(name => {
      const series = (monthly[name] || []).slice(-12)
      const dhwPoints = series.map(p => p.dhw)
      const latest = series[series.length - 1]
      const first = series[0]
      const trendUp = latest && first ? latest.dhw > first.dhw : false
      const status = latest ? getStatusByLabel(
        latest.dhw >= 16 ? 'Alert Level 2' :
        latest.dhw >= 12 ? 'Alert Level 1' :
        latest.dhw >= 8 ? 'Warning' :
        latest.dhw >= 4 ? 'Watch' : 'Normal'
      ) : null
      return { name, dhwPoints, trendUp, status }
    })
  }, [monthly, locations])

  if (!items.length) return null

  return (
    <div className="pts-grid">
      {items.map(item => (
        <div key={item.name} className="pts-card">
          <div className="pts-card-head">
            <span className="pts-name">{item.name}</span>
            <span className={`pts-trend ${item.trendUp ? 'up' : 'down'}`}>
              {item.trendUp ? '↗ memanas' : '↘ mereda'}
            </span>
          </div>
          <Sparkline points={item.dhwPoints} color={item.status?.color || 'var(--c-ocean-500)'} />
          <p className="pts-caption">Tekanan panas 12 bulan terakhir</p>
        </div>
      ))}
    </div>
  )
}
