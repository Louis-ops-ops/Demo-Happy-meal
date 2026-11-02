import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell, type NavItem } from '../components/AppShell'
import { TodayPage } from '../features/today/TodayPage'
import { appPath } from '../platform'
import { PlaceholderPage } from './PlaceholderPage'

const KitPage = lazy(() => import('../features/kit/KitPage'))

const navItems: ReadonlyArray<NavItem> = [
  { to: appPath(), label: "Aujourd'hui", icon: 'sun', end: true },
  { to: appPath('plan'), label: 'Plan', icon: 'calendar' },
  { to: appPath('courses'), label: 'Courses', icon: 'shopping-basket' },
  { to: appPath('suivi'), label: 'Suivi', icon: 'chart-spline' },
  { to: appPath('profil'), label: 'Profil', icon: 'user' },
]

function AppLayout() {
  return (
    <AppShell items={navItems} homePath={appPath()}>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </AppShell>
  )
}

/** App routes, relative so they work under `/app` (web) and `/` (desktop). */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="plan" element={<PlaceholderPage title="Plan" step={6} />} />
        <Route path="courses" element={<PlaceholderPage title="Courses" step={7} />} />
        <Route path="suivi" element={<PlaceholderPage title="Suivi" step={7} />} />
        <Route path="profil" element={<PlaceholderPage title="Profil" step={8} />} />
        <Route path="_kit" element={<KitPage />} />
      </Route>
      <Route path="*" element={<Navigate to={appPath()} replace />} />
    </Routes>
  )
}
