import { Routes, Route } from 'react-router-dom'
import Gateway from './pages/Gateway'
import PublicMode from './pages/PublicMode'
import ResearchMode from './pages/ResearchMode'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gateway />} />
      <Route path="/publik" element={<PublicMode />} />
      <Route path="/peneliti" element={<ResearchMode />} />
    </Routes>
  )
}
