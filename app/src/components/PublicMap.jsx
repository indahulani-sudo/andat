import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { getStatusByLabel } from '../lib/status'
import 'leaflet/dist/leaflet.css'
import './PublicMap.css'

const RAJA_AMPAT_CENTER = [-1.05, 130.55]

export default function PublicMap({ locations, selected, onSelect }) {
  return (
    <MapContainer
      center={RAJA_AMPAT_CENTER}
      zoom={9}
      scrollWheelZoom={false}
      className="pmap"
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      {locations.map(([name, v]) => {
        const status = getStatusByLabel(v.status)
        const isActive = selected === name
        return (
          <CircleMarker
            key={name}
            center={[v.lat, v.lon]}
            radius={isActive ? 14 : 10}
            pathOptions={{
              color: status.color,
              fillColor: status.color,
              fillOpacity: isActive ? 0.9 : 0.65,
              weight: isActive ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(name) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <strong>{name}</strong> &middot; {status.labelPublik}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
