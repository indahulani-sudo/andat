import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { getStatusByLabel } from '../lib/status'
import 'leaflet/dist/leaflet.css'
import './ResearchMap.css'

const RAJA_AMPAT_CENTER = [-1.05, 130.55]

export default function ResearchMap({ locations, onSelect }) {
  return (
    <MapContainer
      center={RAJA_AMPAT_CENTER}
      zoom={9}
      scrollWheelZoom={true}
      className="rmap"
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      {locations.map(([name, v]) => {
        const status = getStatusByLabel(v.status)
        return (
          <CircleMarker
            key={name}
            center={[v.lat, v.lon]}
            radius={11}
            pathOptions={{
              color: status.color,
              fillColor: status.color,
              fillOpacity: 0.7,
              weight: 2,
            }}
            eventHandlers={{ click: () => onSelect?.(name) }}
          >
            <Popup>
              <div className="rmap-popup">
                <div className="rmap-popup-head">
                  <strong>{name}</strong>
                  <span className="rmap-popup-badge" style={{ background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </div>
                <table className="rmap-popup-table">
                  <tbody>
                    <tr><td>SST</td><td>{v.sst.toFixed(1)} °C</td></tr>
                    <tr><td>SST Anomaly</td><td>{v.sst_anomaly > 0 ? '+' : ''}{v.sst_anomaly.toFixed(1)} °C</td></tr>
                    <tr><td>DHW</td><td>{v.dhw.toFixed(1)} °C-weeks</td></tr>
                    <tr><td>Tutupan karang</td><td>{v.coral_cover}</td></tr>
                  </tbody>
                </table>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
