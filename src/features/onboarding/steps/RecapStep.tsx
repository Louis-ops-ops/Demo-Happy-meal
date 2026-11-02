import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { Icon } from '../../../components/Icon'
import { MacroStat } from '../../../components/MacroStat'
import { toIsoDate } from '../../../domain/dates'
import type { TargetsError, TargetsWarning } from '../../../domain/targets'
import { useOnboarding } from '../../../store/onboarding'
import { formatDecimal, formatInt, formatMonthYear } from '../../format'
import { computeRecap } from '../draft'
import { PACE_TITLES } from '../labels'
import { OnboardingLayout } from '../OnboardingLayout'
import { onboardingPath } from '../paths'

/** Kind words for each guardrail warning: information, never blame. */
function warningText(warning: TargetsWarning): string {
  switch (warning.code) {
    case 'pace_capped':
      return `Pour rester en douceur, ton rythme est limité à ${formatDecimal(warning.cappedKgPerWeek)} kg par semaine (environ 1 % de ton poids).`
    case 'kcal_floor':
      return warning.reason === 'bmr'
        ? `On ne descend pas sous ton métabolisme de base (${formatInt(warning.floorKcal)} kcal) : la perte sera un peu plus lente, et c'est très bien.`
        : `On ne descend pas sous ${formatInt(warning.floorKcal)} kcal par jour : la perte sera un peu plus lente, et c'est très bien.`
    case 'no_deficit':
      return 'Avec ces réglages, ton objectif calorique est déjà au plancher conseillé. Plus d’activité au quotidien t’aidera à avancer.'
  }
}

function errorText(error: TargetsError | { code: 'incomplete' }): string {
  switch (error.code) {
    case 'incomplete':
    case 'invalid_input':
      return 'Il manque quelques infos pour faire le calcul. Reviens à l’étape précédente pour les compléter.'
    case 'underage':
      return `Happy meal est réservé aux adultes (${error.minAge} ans et plus).`
    case 'not_weight_loss':
      return 'Pour l’instant, Happy meal accompagne la perte de poids. Tu peux aussi passer l’étape objectif.'
    case 'target_bmi_too_low':
      return `Pour ta santé, vise au moins ${formatDecimal(error.minTargetWeightKg)} kg.`
  }
}

/** Recap (new v2 screen): BMR, TDEE, kcal target, macros, estimated duration. Two columns on desktop. */
export function RecapStep() {
  const navigate = useNavigate()
  const draft = useOnboarding((state) => state.draft)
  const today = toIsoDate(new Date())
  const recap = computeRecap(draft, today)
  const back = () => navigate(onboardingPath(draft.hasGoal ? 'objectif' : 'metriques'))

  if (!recap.ok) {
    return (
      <OnboardingLayout
        title="Ton récap"
        onBack={back}
        action={
          <Button fullWidth onClick={back}>
            Modifier mes réponses
          </Button>
        }
      >
        <Card className="flex gap-03">
          <Icon name="circle-alert" size={24} className="text-text" />
          <p className="text-body text-text">{errorText(recap.error)}</p>
        </Card>
      </OnboardingLayout>
    )
  }

  const { targets } = recap
  const loss = recap.kind === 'loss' ? recap.targets : null

  return (
    <OnboardingLayout
      wide
      onBack={back}
      title="Ton récap"
      intro={loss ? 'Voici ce que Happy meal te propose pour atteindre ton objectif.' : 'Pas d’objectif de poids pour l’instant : on vise l’équilibre.'}
      action={
        <Button fullWidth className="lg:ml-auto lg:w-auto" onClick={() => navigate(onboardingPath('regimes'))}>
          Continuer
        </Button>
      }
    >
      <div className="grid gap-05 lg:grid-cols-2 lg:items-start">
        <Card className="flex flex-col gap-04">
          <p className="text-overline-caps text-text-muted">Ton objectif quotidien</p>
          <p className="flex items-end gap-02">
            <span className="text-display text-text">{formatInt(targets.kcalTarget)}</span>
            <span className="text-body text-text-muted">kcal par jour</span>
          </p>
          <div className="flex gap-03">
            <MacroStat value={`${targets.macros.proteinG} g`} label="Protéines" />
            <MacroStat value={`${targets.macros.carbsG} g`} label="Glucides" />
            <MacroStat value={`${targets.macros.fatG} g`} label="Lipides" />
          </div>
        </Card>

        <dl className="flex flex-col gap-03">
          <Row term="Métabolisme de base" detail="Ce que ton corps dépense au repos">
            {formatInt(targets.bmr)} kcal
          </Row>
          <Row term="Dépense quotidienne" detail="Avec ton activité">
            {formatInt(targets.tdee)} kcal
          </Row>
          {loss && (
            <>
              <Row term="Déficit" detail={`Rythme ${PACE_TITLES[draft.pace].toLowerCase()}`}>
                {formatInt(loss.deficit)} kcal par jour
              </Row>
              <Row term="Perte estimée">{formatDecimal(loss.kgPerWeek)} kg par semaine</Row>
              {loss.estimatedEndDate && (
                <Row term="Objectif vers" detail={`Environ ${loss.estimatedWeeks} semaines`}>
                  {formatMonthYear(loss.estimatedEndDate)}
                </Row>
              )}
            </>
          )}
        </dl>
      </div>

      {loss && loss.warnings.length > 0 && (
        <ul className="flex flex-col gap-03">
          {loss.warnings.map((warning) => (
            <li key={warning.code} className="flex gap-03 rounded-02 bg-surface p-04 shadow-pressed">
              <Icon name="circle-check" size={24} className="shrink-0 text-focus-text" />
              <p className="text-body-sm text-text">{warningText(warning)}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-caption text-text-muted">Estimation indicative, ne remplace pas un avis médical.</p>
    </OnboardingLayout>
  )
}

function Row({ term, detail, children }: { term: string; detail?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-04 rounded-02 px-04 py-03 shadow-flat">
      <dt className="flex flex-col">
        <span className="text-label text-text">{term}</span>
        {detail && <span className="text-caption text-text-muted">{detail}</span>}
      </dt>
      <dd className="text-right text-title-3 whitespace-nowrap text-text">{children}</dd>
    </div>
  )
}
