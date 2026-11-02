import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { ChoiceCards, type Choice } from '../../../components/ChoiceCard'
import { saveOnboarding } from '../../../data/db'
import { toIsoDate } from '../../../domain/dates'
import { appPath } from '../../../platform'
import { useOnboarding } from '../../../store/onboarding'
import { toProfile } from '../draft'
import { OnboardingLayout } from '../OnboardingLayout'
import { onboardingPath } from '../paths'

const DURATIONS: ReadonlyArray<Choice<'7' | '14'>> = [
  { value: '7', title: 'Une semaine', description: 'Idéal pour commencer', icon: 'calendar' },
  { value: '14', title: 'Deux semaines', description: 'Moins de courses à prévoir', icon: 'calendar' },
]

/** Plan duration (new v2 screen). Saves the profile, then the plan screen generates the plan. */
export function DurationStep() {
  const navigate = useNavigate()
  const { draft, update } = useOnboarding()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function finish() {
    setSaving(true)
    setError(null)
    try {
      const { profile, weightKg } = toProfile(draft, toIsoDate(new Date()))
      await saveOnboarding(profile, weightKg)
      // The draft is cleared when a new onboarding starts (splash), not here: clearing it now would
      // re-render this step before the route changes and its guard would send back to the metrics.
      navigate(appPath('plan/nouveau'), { replace: true })
    } catch {
      setError('Impossible d’enregistrer ton profil. Vérifie tes réponses et réessaie.')
      setSaving(false)
    }
  }

  return (
    <OnboardingLayout
      step={5}
      onBack={() => navigate(onboardingPath('foyer'))}
      onSkip={finish}
      title="Sur combien de temps ?"
      intro="Ton plan couvre une ou deux semaines. Tu pourras en refaire un à tout moment."
      action={
        <>
          {error && (
            <p role="alert" className="text-body-sm text-text">
              {error}
            </p>
          )}
          <Button fullWidth icon="spark" disabled={saving} onClick={finish}>
            Créer mon plan
          </Button>
        </>
      }
    >
      <ChoiceCards
        legend="Durée du plan"
        choices={DURATIONS}
        value={String(draft.planDays) as '7' | '14'}
        onChange={(value) => update({ planDays: value === '14' ? 14 : 7 })}
      />
    </OnboardingLayout>
  )
}
