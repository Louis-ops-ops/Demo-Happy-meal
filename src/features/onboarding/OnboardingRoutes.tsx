import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useOnboarding } from '../../store/onboarding'
import { missingMetrics } from './draft'
import { ONBOARDING_STEPS, onboardingPath, type OnboardingStep } from './paths'
import { DietStep } from './steps/DietStep'
import { DurationStep } from './steps/DurationStep'
import { GoalStep } from './steps/GoalStep'
import { HouseholdStep } from './steps/HouseholdStep'
import { MetricsStep } from './steps/MetricsStep'
import { RecapStep } from './steps/RecapStep'
import { IntroStep, SplashStep } from './steps/WelcomeSteps'

const SCREENS: Record<OnboardingStep, () => React.JSX.Element> = {
  accueil: SplashStep,
  presentation: IntroStep,
  metriques: MetricsStep,
  objectif: GoalStep,
  recap: RecapStep,
  regimes: DietStep,
  foyer: HouseholdStep,
  duree: DurationStep,
}

const METRICS_INDEX = ONBOARDING_STEPS.indexOf('metriques')

function StepScreen() {
  const { step } = useParams()
  const draft = useOnboarding((state) => state.draft)
  const known = ONBOARDING_STEPS.find((s) => s === step)
  if (!known) return <Navigate to={onboardingPath('accueil')} replace />
  // Steps after the metrics need them (e.g. after a page reload, answers are in memory only).
  if (ONBOARDING_STEPS.indexOf(known) > METRICS_INDEX && missingMetrics(draft).length > 0) {
    return <Navigate to={onboardingPath('metriques')} replace />
  }
  const Screen = SCREENS[known]
  return <Screen />
}

/** Onboarding, full screen (outside the AppShell): splash → … → plan duration. */
export function OnboardingRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to={onboardingPath('accueil')} replace />} />
      <Route path=":step" element={<StepScreen />} />
    </Routes>
  )
}
