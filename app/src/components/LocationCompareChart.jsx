import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts'
import { getStatusByDHW } from '../lib/status'
import './LocationCompareChart.css'

function ParamBar({ data, dataKey, title, unit, colorFn, refLines }) {
  return (
    <div className="lcc-panel">
      <p className="lcc-panel-title">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--border-default)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={{ stroke: 'var(--border-default)' }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            formatter={(v) => [`${v.toFixed(2)} ${unit}`, title]}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid var(--border-default)' }}
          />
          {refLines}
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorFn ? colorFn(d) : 'var(--c-ocean-500)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function LocationCompareChart({ summary }) {
  const data = Object.entries(summary).map(([name, v]) => ({ name, ...v }))

  return (
    <div className="lcc-grid">
      <ParamBar
        data={data}
        dataKey="sst"
        title="SST per lokasi"
        unit="°C"
        colorFn={() => 'var(--c-ocean-500)'}
      />
      <ParamBar
        data={data}
        dataKey="sst_anomaly"
        title="SST anomaly per lokasi"
        unit="°C"
        colorFn={(d) => d.sst_anomaly >= 1.5 ? 'var(--c-coral-warning)' : 'var(--c-ocean-300)'}
        refLines={<ReferenceLine y={0} stroke="var(--border-strong)" />}
      />
      <ParamBar
        data={data}
        dataKey="dhw"
        title="DHW per lokasi"
        unit="°C-weeks"
        colorFn={(d) => getStatusByDHW(d.dhw).color}
        refLines={<>
          <ReferenceLine y={4} stroke="var(--c-coral-watch)" strokeDasharray="3 3" />
          <ReferenceLine y={8} stroke="var(--c-coral-warning)" strokeDasharray="3 3" />
        </>}
      />
    </div>
  )
}
