import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ClayIcon } from '../../components/ClayIcon'
import { activatePlan, saveDayMeals } from '../../data/db'
import { applySwap } from '../../domain/plan'
import { appPath } from '../../platform'
import { formatRange } from './labels'
import { PlanDayView } from './PlanDayView'
import { PlanGrid } from './PlanGrid'
import { SwapPanel } from './SwapPanel'
import { usePlan } from './usePlan'

const SETUP = 'plan/nouveau'

/** Plan tab: the draft preview (to validate) or the active plan, with swaps. */
export function PlanPage() {
  const navigate = useNavigate()
  const state = usePlan()
  const [day, setDay] = useState(0)
  const [swapping, setSwapping] = useState<{ day: number; index: number } | null>(null)
  const [notice, setNotice] = useState('')
  const goSetup = () => navigate(appPath(SETUP))
  const closeSwap = useCallback(() => setSwapping(null), [])

  if (state.status === 'loading') return <p className="text-body text-text-muted">Chargement de ton plan…</p>

  if (state.status === 'error') {
    return (
      <Card className="max-w-[70ch]" role="alert">
        <p className="text-body-lg text-text">Impossible de charger les recettes.</p>
        <p className="mt-02 text-body-sm text-text-muted">{state.message}</p>
      </Card>
    )
  }

  if (state.status === 'empty') {
    return (
      <section className="mx-auto flex max-w-[520px] flex-col items-center gap-05 pt-05 text-center">
        <span className="flex size-32 items-center justify-center rounded-full bg-surface shadow-raised">
          <ClayIcon id="cocotte" size={80} />
        </span>
        <div className="flex flex-col gap-02">
          <h1 className="text-title-1 text-text">Pas encore de plan</h1>
          <p className="text-body text-text-muted">
            Happy meal compose pour toi une semaine ou deux de repas, calés sur tes besoins.
          </p>
        </div>
        <Button icon="spark" onClick={goSetup}>
          Créer mon plan
        </Button>
      </section>
    )
  }

  const { plan } = state
  const draft = plan.status === 'draft'

  const pick = async (recipeId: string) => {
    if (!swapping) return
    const next = applySwap(state.input, state.meals, swapping.day, swapping.index, recipeId)
    await saveDayMeals(plan.id, swapping.day, next)
    setSwapping(null)
    setNotice('Repas changé. Le total de la journée a été ajusté.')
  }

  const validate = async () => {
    await activatePlan(plan.id)
    setNotice('Plan validé. Bon appétit !')
  }

  return (
    <section className="flex flex-col gap-05">
      <header className="flex flex-col gap-03 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-01">
          <p className="text-overline-caps text-text-muted">{draft ? 'Aperçu' : 'Plan en cours'}</p>
          <h1 className="text-display text-text">Ton plan</h1>
          <p className="text-body text-text-muted">
            {formatRange(plan.startDate, plan.days)} · {plan.days} jours
          </p>
        </div>
        <div className="flex flex-col-reverse gap-03 md:flex-row">
          {draft ? (
            <>
              <Button variant="secondary" icon="refresh-cw" onClick={goSetup}>
                Régénérer
              </Button>
              <Button icon="check" onClick={validate}>
                Valider le plan
              </Button>
            </>
          ) : (
            <Button variant="secondary" icon="refresh-cw" onClick={goSetup}>
              Nouveau plan
            </Button>
          )}
        </div>
      </header>

      {draft && (
        <p className="rounded-02 bg-surface p-04 text-body text-text-muted shadow-pressed">
          Voici une proposition. Change les repas qui ne te plaisent pas, puis valide quand tu es content.
        </p>
      )}
      <p role="status" className="text-body-sm text-focus-text empty:hidden">
        {notice}
      </p>

      <PlanDayView state={state} day={day} onDay={setDay} onSwap={(d, i) => setSwapping({ day: d, index: i })} keysEnabled={!swapping} />
      <PlanGrid state={state} selected={swapping} onSwap={(d, i) => setSwapping({ day: d, index: i })} />

      {swapping && <SwapPanel state={state} day={swapping.day} index={swapping.index} onPick={pick} onClose={closeSwap} />}
    </section>
  )
}
