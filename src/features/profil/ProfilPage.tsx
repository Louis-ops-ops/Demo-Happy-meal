import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { db, latestWeighIn, type Profile } from '../../data/db'
import { DIETS } from '../../domain/diet'
import { ageOn } from '../../domain/body'
import { toIsoDate } from '../../domain/dates'
import { platform } from '../../platform'
import { formatDecimal, formatInt } from '../format'
import { ACTIVITIES, DIET_LABELS, PACE_TITLES } from '../onboarding/labels'
import { profileToDraft } from '../onboarding/draft'
import { onboardingPath, type OnboardingStep } from '../onboarding/paths'
import { useOnboarding } from '../../store/onboarding'
import { AboutCard } from './AboutCard'
import { DataCard } from './DataCard'

/** Profil tab: what the person told us, how to change it, their data (export / import / reset) and the sources. */
export function ProfilPage() {
  const navigate = useNavigate()
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null)
  const weight = useLiveQuery(() => latestWeighIn())
  const update = useOnboarding((state) => state.update)
  if (!profile) return <p className="text-body text-text-muted">Chargement…</p>

  const edit = (step: OnboardingStep) => {
    update(profileToDraft(profile, weight?.kg ?? 70))
    navigate(onboardingPath(step))
  }
  const today = toIsoDate(new Date())

  return (
    <section className="flex flex-col gap-05">
      <header className="flex flex-col gap-01">
        <p className="text-overline-caps text-text-muted">Réglages</p>
        <h1 className="text-display text-text">Profil</h1>
      </header>

      <div className="grid gap-05 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-05">
          <Card className="flex flex-col gap-04">
            <h2 className="text-title-3 text-text">Mes informations</h2>
            <dl className="flex flex-col divide-y divide-darkgreen-200">
              <Row label="Sexe" value={profile.sex === 'male' ? 'Homme' : 'Femme'} />
              <Row label="Âge" value={`${ageOn(profile.birthDate, today)} ans`} />
              <Row label="Taille" value={`${formatInt(profile.heightCm)} cm`} />
              <Row label="Poids" value={weight ? `${formatDecimal(weight.kg)} kg` : '—'} />
              <Row label="Activité" value={ACTIVITIES.find((a) => a.value === profile.activity)?.title ?? ''} />
              <Row label="Objectif" value={goalText(profile)} />
              <Row label="Calories par jour" value={`${formatInt(profile.kcalTarget)} kcal`} />
            </dl>
            <Button variant="secondary" onClick={() => edit('metriques')}>
              Modifier mes informations
            </Button>
          </Card>

          <Card className="flex flex-col gap-04">
            <h2 className="text-title-3 text-text">Mon alimentation</h2>
            <dl className="flex flex-col divide-y divide-darkgreen-200">
              <Row label="Régimes" value={dietsText(profile)} />
              <Row label="Aliments exclus" value={profile.exclusions.join(', ') || 'Aucun'} />
              <Row label="Personnes" value={String(profile.householdSize)} />
              <Row label="Repas par jour" value={String(profile.mealsPerDay)} />
              <Row label="Durée d’un plan" value={`${profile.planDays} jours`} />
            </dl>
            <Button variant="secondary" onClick={() => edit('regimes')}>
              Modifier mon alimentation
            </Button>
            <p className="text-caption text-text-muted">Tes réglages s’appliquent au prochain plan que tu crées.</p>
          </Card>
        </div>

        <div className="flex flex-col gap-05">
          <DataCard profile={profile} showDemo={platform.hasDemo} />
          <AboutCard />
        </div>
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-04 py-02">
      <dt className="text-body-sm text-text-muted">{label}</dt>
      <dd className="text-right text-body text-text">{value}</dd>
    </div>
  )
}

function goalText(profile: Profile): string {
  return profile.goal
    ? `${formatDecimal(profile.goal.targetWeightKg)} kg · rythme ${PACE_TITLES[profile.goal.pace].toLowerCase()}`
    : 'Garder mon poids'
}

function dietsText(profile: Profile): string {
  const labels = profile.diets.filter((d) => d in DIETS).map((d) => DIET_LABELS[d])
  return labels.join(', ') || 'Aucun'
}
