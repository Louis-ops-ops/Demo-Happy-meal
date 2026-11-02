import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { ChoiceCards } from '../../../components/ChoiceCard'
import { TextField } from '../../../components/TextField'
import { bmi, MIN_TARGET_BMI, weightForBmi } from '../../../domain/body'
import { useOnboarding } from '../../../store/onboarding'
import { formatDecimal } from '../../format'
import { parseDecimal } from '../draft'
import { PACES } from '../labels'
import { OnboardingLayout } from '../OnboardingLayout'
import { onboardingPath } from '../paths'

/** Goal (new v2 screen): target weight and pace. Skipping it means maintenance. */
export function GoalStep() {
  const navigate = useNavigate()
  const { draft, update } = useOnboarding()

  const height = parseDecimal(draft.heightCm)
  const current = parseDecimal(draft.weightKg)
  const target = parseDecimal(draft.targetWeightKg)
  const hasTarget = Number.isFinite(target)
  const targetBmi = hasTarget ? bmi(target, height) : null
  const minWeight = Math.ceil(weightForBmi(MIN_TARGET_BMI, height) * 10) / 10

  let hint: string | undefined
  if (hasTarget && target >= current) hint = 'Pour l’instant, Happy meal accompagne la perte de poids. Tu peux passer cette étape.'
  else if (targetBmi !== null && targetBmi < MIN_TARGET_BMI) {
    hint = `Pour ta santé, vise au moins ${formatDecimal(minWeight)} kg (IMC de ${formatDecimal(MIN_TARGET_BMI)}).`
  } else if (targetBmi !== null) hint = `IMC visé : ${formatDecimal(Math.round(targetBmi * 10) / 10)}`

  const valid = hasTarget && target < current && targetBmi !== null && targetBmi >= MIN_TARGET_BMI

  return (
    <OnboardingLayout
      step={2}
      onBack={() => navigate(onboardingPath('metriques'))}
      onSkip={() => {
        update({ hasGoal: false })
        navigate(onboardingPath('recap'))
      }}
      title="Ton objectif"
      intro="Choisis un poids cible et un rythme. Tu pourras les changer quand tu veux."
      action={
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => {
            update({ hasGoal: true })
            navigate(onboardingPath('recap'))
          }}
        >
          Voir mon récap
        </Button>
      }
    >
      <TextField
        label="Poids cible"
        inputMode="decimal"
        placeholder={Number.isFinite(current) ? formatDecimal(Math.round(current * 0.95)) : '65'}
        value={draft.targetWeightKg}
        onChange={(event) => update({ targetWeightKg: event.target.value })}
        suffix="kg"
        hint={hint}
      />
      <ChoiceCards legend="Ton rythme" choices={PACES} value={draft.pace} onChange={(pace) => update({ pace })} />
      <p className="text-caption text-text-muted">
        Un rythme doux est plus facile à tenir. Le rythme est limité à environ 1 % de ton poids par semaine.
      </p>
    </OnboardingLayout>
  )
}
