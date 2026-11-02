import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Stepper } from '../../../components/Stepper'
import { useOnboarding } from '../../../store/onboarding'
import { MEALS_PER_DAY_LABELS } from '../labels'
import { OnboardingLayout } from '../OnboardingLayout'
import { onboardingPath } from '../paths'

/** Figma O4 Foyer (33:4038). The calorie field is replaced by meals per day (kcal now come from the recap). */
export function HouseholdStep() {
  const navigate = useNavigate()
  const { draft, update } = useOnboarding()
  const next = () => navigate(onboardingPath('duree'))

  return (
    <OnboardingLayout
      step={4}
      onBack={() => navigate(onboardingPath('regimes'))}
      onSkip={next}
      title="Tu cuisines pour combien ?"
      intro="Les quantités de ta liste de courses s’adaptent à ton foyer."
      action={
        <Button fullWidth onClick={next}>
          Continuer
        </Button>
      }
    >
      <Card className="flex items-center gap-03 px-05 py-04">
        <div className="flex flex-1 flex-col gap-01">
          <span className="text-title-3 text-text">Personnes</span>
          <span className="text-caption text-text-muted">Dans ton foyer</span>
        </div>
        <Stepper label="Personnes" value={draft.householdSize} min={1} max={8} onChange={(householdSize) => update({ householdSize })} />
      </Card>

      <Card className="flex items-center gap-03 px-05 py-04">
        <div className="flex flex-1 flex-col gap-01">
          <span className="text-title-3 text-text">Repas par jour</span>
          <span className="text-caption text-text-muted">{MEALS_PER_DAY_LABELS[draft.mealsPerDay]}</span>
        </div>
        <Stepper label="Repas par jour" value={draft.mealsPerDay} min={2} max={5} onChange={(mealsPerDay) => update({ mealsPerDay })} />
      </Card>

      <p className="text-caption text-text-muted">
        Tes calories sont calculées pour toi uniquement. Les autres personnes du foyer comptent pour les courses.
      </p>
    </OnboardingLayout>
  )
}
