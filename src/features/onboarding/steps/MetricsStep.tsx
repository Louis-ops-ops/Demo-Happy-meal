import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { ChoiceCards } from '../../../components/ChoiceCard'
import { SegmentedControl } from '../../../components/SegmentedControl'
import { TextField } from '../../../components/TextField'
import { ageOn, MIN_AGE } from '../../../domain/body'
import { toIsoDate } from '../../../domain/dates'
import { INPUT_LIMITS } from '../../../domain/targets'
import type { Sex } from '../../../domain/types'
import { useOnboarding } from '../../../store/onboarding'
import { missingMetrics, parseDecimal } from '../draft'
import { ACTIVITIES } from '../labels'
import { OnboardingLayout } from '../OnboardingLayout'
import { onboardingPath } from '../paths'

const SEXES = [
  { value: 'female', label: 'Femme' },
  { value: 'male', label: 'Homme' },
] as const satisfies ReadonlyArray<{ value: Sex; label: string }>

function rangeHint(text: string, { min, max }: { min: number; max: number }, unit: string): string | undefined {
  const value = parseDecimal(text)
  if (!text || (Number.isFinite(value) && value >= min && value <= max)) return undefined
  return `Indique une valeur entre ${min} et ${max} ${unit}.`
}

/** Metrics (new v2 screen, built from the kit): the only mandatory step. */
export function MetricsStep() {
  const navigate = useNavigate()
  const { draft, update } = useOnboarding()
  const today = toIsoDate(new Date())

  const age = draft.birthDate && draft.birthDate <= today ? ageOn(draft.birthDate, today) : null
  const underage = age !== null && age < MIN_AGE
  const heightHint = rangeHint(draft.heightCm, INPUT_LIMITS.heightCm, 'cm')
  const weightHint = rangeHint(draft.weightKg, INPUT_LIMITS.weightKg, 'kg')
  const canContinue = missingMetrics(draft).length === 0 && !underage && !heightHint && !weightHint

  return (
    <OnboardingLayout
      step={1}
      onBack={() => navigate(onboardingPath('presentation'))}
      title="Parlons de toi"
      intro="Ces infos servent à estimer tes besoins. Elles restent sur ton appareil."
      action={
        <Button fullWidth disabled={!canContinue} onClick={() => navigate(onboardingPath('objectif'))}>
          Continuer
        </Button>
      }
    >
      <div className="flex flex-col gap-02">
        <span className="text-label text-text" id="sex-label">
          Sexe
        </span>
        <SegmentedControl
          label="Sexe"
          options={SEXES}
          value={draft.sex ?? ('' as Sex)}
          onChange={(sex) => update({ sex })}
        />
        <span className="text-caption text-text-muted">Utilisé uniquement pour le calcul du métabolisme.</span>
      </div>

      <TextField
        label="Date de naissance"
        type="date"
        max={today}
        value={draft.birthDate}
        onChange={(event) => update({ birthDate: event.target.value })}
        hint={underage ? `Happy meal est réservé aux adultes (${MIN_AGE} ans et plus).` : undefined}
      />

      <div className="grid grid-cols-2 gap-04">
        <TextField
          label="Taille"
          inputMode="numeric"
          placeholder="170"
          value={draft.heightCm}
          onChange={(event) => update({ heightCm: event.target.value })}
          suffix="cm"
          hint={heightHint}
        />
        <TextField
          label="Poids"
          inputMode="decimal"
          placeholder="70"
          value={draft.weightKg}
          onChange={(event) => update({ weightKg: event.target.value })}
          suffix="kg"
          hint={weightHint}
        />
      </div>

      <ChoiceCards
        legend="Ton activité au quotidien"
        choices={ACTIVITIES}
        value={draft.activity}
        onChange={(activity) => update({ activity })}
      />
    </OnboardingLayout>
  )
}
