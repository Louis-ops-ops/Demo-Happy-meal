import { Navigate, Route, Routes } from 'react-router-dom'
import { TodayPage } from '../features/today/TodayPage'

/** App routes, relative so they work under `/app` (web) and `/` (desktop). */
export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<TodayPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  )
}
