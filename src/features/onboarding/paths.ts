import { appPath } from '../../platform'

/** Onboarding steps in order; each one is its own URL so the browser back button works. */
export const ONBOARDING_STEPS = [
  'accueil',
  'presentation',
  'metriques',
  'objectif',
  'recap',
  'regimes',
  'foyer',
  'duree',
] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export function onboardingPath(step: OnboardingStep): string {
  return appPath(`bienvenue/${step}`)
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  return ONBOARDING_STEPS[Math.min(ONBOARDING_STEPS.indexOf(step) + 1, ONBOARDING_STEPS.length - 1)]!
}
