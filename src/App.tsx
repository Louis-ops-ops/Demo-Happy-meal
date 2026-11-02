import { Route, Routes } from 'react-router-dom'
import { platform } from './platform'
import { AppRoutes } from './routes/AppRoutes'
import { PortfolioPage } from './portfolio/PortfolioPage'

export function App() {
  const { Router } = platform

  return (
    <Router>
      {platform.hasPortfolio ? (
        <Routes>
          <Route path="/" element={<PortfolioPage />} />
          <Route path="/app/*" element={<AppRoutes />} />
          <Route path="*" element={<PortfolioPage />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      )}
    </Router>
  )
}
