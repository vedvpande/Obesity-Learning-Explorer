import { Route, Routes } from 'react-router'
import AuthProvider from './auth/AuthProvider.tsx'
import Layout from './components/Layout.tsx'
import AboutPage from './pages/AboutPage.tsx'
import ExplorePage from './pages/ExplorePage.tsx'
import LandingPage from './pages/LandingPage.tsx'
import LearnPage from './pages/LearnPage.tsx'
import MyReportPage from './pages/MyReportPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import RankingsPage from './pages/RankingsPage.tsx'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/my-report" element={<MyReportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
