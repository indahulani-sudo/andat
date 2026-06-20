import { Link } from 'react-router-dom'
import './ModeHeader.css'

export default function ModeHeader({ mode }) {
  const isPublic = mode === 'publik'
  return (
    <header className="mh">
      <Link to="/" className="mh-brand">
        <span className="mh-brand-mark">RA</span>
        <span className="mh-brand-text">Coral Heat Stress Watch</span>
      </Link>

      <div className="mh-switch" role="group" aria-label="Pilih mode tampilan">
        <Link to="/publik" className={`mh-switch-item ${isPublic ? 'active' : ''}`}>
          Publik
        </Link>
        <Link to="/peneliti" className={`mh-switch-item ${!isPublic ? 'active' : ''}`}>
          Peneliti
        </Link>
      </div>
    </header>
  )
}
