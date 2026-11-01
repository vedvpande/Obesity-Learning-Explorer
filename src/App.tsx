import { Route, Routes } from 'react-router'
import ExplorePage from './pages/ExplorePage.tsx'
import LandingPage from './pages/LandingPage.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/explore" element={<ExplorePage />} />
    </Routes>
  )
}

export default App
