import { useLiveQuery } from 'dexie-react-hooks'
import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell, type NavItem } from '../components/AppShell'
import { KcalSummary } from '../components/KcalSummary'
import { db } from '../data/db'
import { onboardingPath } from '../features/onboarding/paths'
import { OnboardingRoutes } from '../features/onboarding/OnboardingRoutes'
import { CoursesPage } from '../features/courses/CoursesPage'
import { RecipePage } from '../features/recipe/RecipePage'
import { SuiviPage } from '../features/suivi/SuiviPage'
import { DemoPage } from '../features/demo/DemoPage'
import { ProfilPage } from '../features/profil/ProfilPage'
import { PlanPage } from '../features/plan/PlanPage'
import { PlanSetupPage } from '../features/plan/PlanSetupPage'
import { TodayPage } from '../features/today/TodayPage'
import { toIsoDate } from '../domain/dates'
import { dayNutrients } from '../domain/journal'
import { appPath } from '../platform'

const KitPage = lazy(() => import('../features/kit/KitPage'))

const navItems: ReadonlyArray<NavItem> = [
  { to: appPath(), label: "Aujourd'hui", icon: 'sun', end: true },
  { to: appPath('plan'), label: 'Plan', icon: 'calendar' },
  { to: appPath('courses'), label: 'Courses', icon: 'shopping-basket' },
  { to: appPath('suivi'), label: 'Suivi', icon: 'chart-spline' },
  { to: appPath('profil'), label: 'Profil', icon: 'user' },
]

function AppLayout() {
  const profile = useLiveQuery(() => db.profile.get('me'))
  const today = toIsoDate(new Date())
  const eatenKcal = useLiveQuery(
    async () => dayNutrients(await db.journal.where('date').equals(today).toArray()).kcal,
    [today],
  )

  return (
    <AppShell
      items={navItems}
      homePath={appPath()}
      sidebarFooter={profile ? <KcalSummary value={eatenKcal ?? 0} target={profile.kcalTarget} /> : undefined}
    >
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </AppShell>
  )
}

/** Sends to the onboarding while there is no profile yet. */
function RequireProfile() {
  // null = no profile, undefined = still loading.
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null)
  if (profile === undefined) return null
  if (profile === null) return <Navigate to={onboardingPath('accueil')} replace />
  return <Outlet />
}

/** App routes, relative so they work under `/app` (web) and `/` (desktop). */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="bienvenue/*" element={<OnboardingRoutes />} />
      <Route path="demo" element={<DemoPage />} />
      <Route element={<AppLayout />}>
        <Route element={<RequireProfile />}>
          <Route index element={<TodayPage />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="plan/nouveau" element={<PlanSetupPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="suivi" element={<SuiviPage />} />
          <Route path="profil" element={<ProfilPage />} />
        </Route>
        <Route path="_kit" element={<KitPage />} />
      </Route>
      <Route element={<RequireProfile />}>
        <Route path="recette/:recipeId" element={<RecipePage />} />
      </Route>
      <Route path="*" element={<Navigate to={appPath()} replace />} />
    </Routes>
  )
}
