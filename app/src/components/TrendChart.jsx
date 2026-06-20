import { useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import './TrendChart.css'

const LOCATION_COLORS = {
  Waigeo: '#1c7aa8',
  Batanta: '#0f7a6c',
  Misool: '#d97642',
  Salawati: '#7a5fb0',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tc-tooltip">
      <p className="tc-tooltip-label">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="tc-tooltip-row">
          <span className="tc-tooltip-dot" style={{ background: p.color }} />
          <span className="tc-tooltip-name">{p.name}</span>
          <span className="tc-tooltip-value">{p.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ monthly, locations, metric, fromDate, toDate }) {
  const data = useMemo(() => {
    if (!monthly) return []
    const dateSet = new Set()
    locations.forEach(loc => {
      (monthly[loc] || []).forEach(p => {
        if (p.date >= fromDate && p.date <= toDate) dateSet.add(p.date)
      })
    })
    const dates = Array.from(dateSet).sort()
    return dates.map(date => {
      const row = { date }
      locations.forEach(loc => {
        const point = (monthly[loc] || []).find(p => p.date === date)
        row[loc] = point ? point[metric] : null
      })
      return row
    })
  }, [monthly, locations, metric, fromDate, toDate])

  const yLabel = metric === 'sst' ? 'SST (°C)' : metric === 'sst_anomaly' ? 'Anomaly (°C)' : 'DHW (°C-weeks)'

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="var(--border-default)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
          tickFormatter={(d) => d.slice(0, 4)}
          minTickGap={40}
          axisLine={{ stroke: 'var(--border-default)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--text-secondary)' } }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {metric === 'sst_anomaly' && <ReferenceLine y={0} stroke="var(--border-strong)" />}
        {metric === 'dhw' && (
          <>
            <ReferenceLine y={4} stroke="var(--c-coral-watch)" strokeDasharray="4 4" />
            <ReferenceLine y={8} stroke="var(--c-coral-warning)" strokeDasharray="4 4" />
          </>
        )}
        {locations.map(loc => (
          <Line
            key={loc}
            type="monotone"
            dataKey={loc}
            stroke={LOCATION_COLORS[loc] || '#888'}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
