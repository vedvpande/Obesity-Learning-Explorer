import { Route, Routes } from 'react-router'
import AboutPage from './pages/AboutPage.tsx'
import ExplorePage from './pages/ExplorePage.tsx'
import LandingPage from './pages/LandingPage.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}

export default App
