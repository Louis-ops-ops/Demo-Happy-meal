import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { IconButton } from '../../components/IconButton'
import { SegmentedControl } from '../../components/SegmentedControl'
import { TextField } from '../../components/TextField'
import { deleteWeighIn, saveWeighIn, updateProfileTargets } from '../../data/db'
import { isIsoDate } from '../../domain/dates'
import { computeMaintenance, computeTargets } from '../../domain/targets'
import { recalcDue } from '../../domain/tracking'
import { formatDecimal, formatInt } from '../format'
import { parseDecimal } from '../onboarding/draft'
import { KcalChart } from './KcalChart'
import { formatLongDate, formatShortDate } from './labels'
import { useTracking, type Tracking } from './useTracking'
import { WeightChart } from './WeightChart'

const RANGES = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
] as const

/** Suivi tab: weight curve with its 7-day average, stats, kcal history. A dashboard from 1024 px. */
export function SuiviPage() {
  const tracking = useTracking()
  const [range, setRange] = useState<'7' | '30'>('7')
  if (!tracking) return <p className="text-body text-text-muted">Chargement…</p>

  const { profile, smoothed, trend, goalDate, averageKcal, adherence, kcal, today } = tracking
  const lastKg = smoothed.at(-1)

  return (
    <section className="flex flex-col gap-05">
      <header className="flex flex-col gap-01">
        <p className="text-overline-caps text-text-muted">Ta progression</p>
        <h1 className="text-display text-text">Suivi</h1>
      </header>

      {recalcDue(profile.updatedAt, today) && lastKg && <RecalcBanner tracking={tracking} />}

      <div className="grid gap-05 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-05">
          <Card className="flex flex-col gap-04">
            <h2 className="text-title-3 text-text">Poids</h2>
            {smoothed.length > 0 ? (
              <WeightChart entries={smoothed} targetKg={profile.goal?.targetWeightKg ?? null} />
            ) : (
              <p className="text-body text-text-muted">Aucune pesée pour l’instant. Ajoute la première quand tu veux.</p>
            )}
          </Card>

          <Card className="flex flex-col gap-04">
            <div className="flex items-center justify-between gap-03">
              <h2 className="text-title-3 text-text">Calories</h2>
              <SegmentedControl label="Période" options={RANGES} value={range} onChange={setRange} className="w-auto max-w-[220px]" />
            </div>
            <KcalChart days={kcal.slice(-Number(range))} target={profile.kcalTarget} />
          </Card>
        </div>

        <div className="flex flex-col gap-05">
          <div className="grid grid-cols-2 gap-03">
            <Stat
              label="Tendance"
              value={trend === null ? '—' : `${trend > 0 ? '+' : ''}${formatDecimal(Math.round(trend * 100) / 100)} kg`}
              hint={trend === null ? 'Il faut une semaine de pesées' : 'par semaine'}
            />
            <Stat
              label="Objectif"
              value={goalDate ? formatLongDate(goalDate) : '—'}
              hint={profile.goal ? `${formatDecimal(profile.goal.targetWeightKg)} kg` : 'Pas d’objectif de poids'}
              small
            />
            <Stat label="Calories" value={averageKcal === null ? '—' : formatInt(averageKcal)} hint="moyenne sur 7 jours" />
            <Stat label="Plan suivi" value={adherence === null ? '—' : `${adherence} %`} hint="des repas prévus mangés" />
          </div>
          <WeighInForm tracking={tracking} />
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, hint, small }: { label: string; value: string; hint: string; small?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-01 rounded-03 bg-surface p-04 shadow-pressed">
      <span className="text-caption text-text-muted">{label}</span>
      <span className={small ? 'text-title-3 text-text' : 'text-title-1 text-text'}>{value}</span>
      <span className="text-caption text-text-muted">{hint}</span>
    </div>
  )
}

function WeighInForm({ tracking }: { tracking: Tracking }) {
  const [kg, setKg] = useState('')
  const [date, setDate] = useState(tracking.today)
  const value = parseDecimal(kg)
  const valid = Number.isFinite(value) && value >= 30 && value <= 300 && isIsoDate(date) && date <= tracking.today
  const recent = [...tracking.weighIns].reverse().slice(0, 5)

  async function save() {
    if (!valid) return
    await saveWeighIn(date, value)
    setKg('')
    setDate(tracking.today)
  }

  return (
    <Card className="flex flex-col gap-04">
      <h2 className="text-title-3 text-text">Ajouter une pesée</h2>
      <p className="text-body-sm text-text-muted">Quand tu veux, sans pression : une pesée de temps en temps suffit.</p>
      <div className="flex flex-col gap-03">
        <TextField label="Poids" suffix="kg" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} />
        <TextField label="Date" type="date" max={tracking.today} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button fullWidth icon="plus" disabled={!valid} onClick={save}>
        Enregistrer
      </Button>
      {recent.length > 0 && (
        <ul className="flex flex-col divide-y divide-darkgreen-200" aria-label="Dernières pesées">
          {recent.map((w) => (
            <li key={w.date} className="flex items-center gap-03 py-01">
              <span className="flex-1 text-body-sm text-text-muted">{formatShortDate(w.date)}</span>
              <span className="text-body text-text">{formatDecimal(w.kg)} kg</span>
              <IconButton
                icon="trash"
                label={`Supprimer la pesée du ${formatShortDate(w.date)}`}
                onClick={() => deleteWeighIn(w.date)}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/** Every 14 days the targets are offered a new calculation from the latest weight. */
function RecalcBanner({ tracking }: { tracking: Tracking }) {
  const { profile, smoothed, today } = tracking
  const [done, setDone] = useState<string | null>(null)
  const kg = smoothed.at(-1)!.avg7

  async function recalc() {
    const base = {
      sex: profile.sex,
      birthDate: profile.birthDate,
      heightCm: profile.heightCm,
      weightKg: kg,
      activity: profile.activity,
    }
    const result = profile.goal
      ? computeTargets({ ...base, targetWeightKg: profile.goal.targetWeightKg, pace: profile.goal.pace }, today)
      : computeMaintenance(base, today)
    if (!result.ok) {
      setDone('Le calcul n’est pas possible avec ces données. Tu peux vérifier ton profil.')
      return
    }
    await updateProfileTargets(result.targets.kcalTarget, result.targets.macros, today)
    setDone(`C’est fait : ta cible est maintenant de ${formatInt(result.targets.kcalTarget)} kcal par jour.`)
  }

  return (
    <Card relief="pressed" className="flex flex-col items-start gap-03">
      <p className="text-body-lg text-text">
        {done ?? 'Ça fait deux semaines ! On refait le point sur tes calories avec ton poids actuel ?'}
      </p>
      {!done && <Button onClick={recalc}>Recalculer ma cible</Button>}
    </Card>
  )
}
