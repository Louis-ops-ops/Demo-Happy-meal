import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { IconButton } from '../../components/IconButton'
import { db, setPlanMealEaten } from '../../data/db'
import { useReferenceData } from '../../data/useReferenceData'
import { toIsoDate } from '../../domain/dates'
import { dayNutrients, planDayIndex, recipeEntryNutrients } from '../../domain/journal'
import { recipeScale } from '../../domain/recipe'
import { appPath } from '../../platform'
import { planMealEntry } from '../today/entries'
import { CookingView } from './CookingView'
import { RecipeDone, RecipeSaved } from './RecipeFinish'
import { RecipeOverview } from './RecipeOverview'
import type { RecipeView } from './types'
import { useStepTimers } from './useStepTimers'

type Stage = 'overview' | 'cooking' | 'done' | 'saved'

const TITLES: Record<Stage, string> = { overview: 'Recette', cooking: 'En cuisine', done: 'Fin de recette', saved: '' }

/**
 * Recipe flow: overview (ingredients, equipment), step by step with timers, end, confirmation.
 * `?repas=planId:day:index` ties it to a planned meal: quantities follow the plan and the meal can be ticked.
 */
export function RecipePage() {
  const navigate = useNavigate()
  const { recipeId } = useParams()
  const [params] = useSearchParams()
  const mealKey = params.get('repas')
  const reference = useReferenceData()
  const timers = useStepTimers()
  const [stage, setStage] = useState<Stage>('overview')
  const [step, setStep] = useState(0)
  const today = toIsoDate(new Date())

  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null)
  const planned = useLiveQuery(async () => {
    if (!mealKey) return null
    const [planId, day, index] = mealKey.split(':')
    const plan = planId ? await db.plans.get(planId) : undefined
    const meal = plan ? await db.planMeals.get([planId!, Number(day), Number(index)]) : undefined
    return plan && meal ? { plan, meal } : null
  }, [mealKey])
  const todayEntries = useLiveQuery(() => db.journal.where('date').equals(today).toArray(), [today])

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate(appPath()))

  if (reference.status === 'error') return <Shell onBack={back}><p role="alert">{reference.message}</p></Shell>
  const recipe = reference.status === 'ready' ? reference.data.recipes.get(recipeId ?? '') : undefined
  if (reference.status === 'loading' || profile === undefined || planned === undefined || !todayEntries) {
    return <Shell onBack={back}><p className="text-body text-text-muted">Chargement…</p></Shell>
  }
  if (!recipe || !profile) {
    return (
      <Shell onBack={back}>
        <Card className="flex max-w-[520px] flex-col items-start gap-04">
          <p className="text-body-lg text-text">Cette recette est introuvable.</p>
          <Button onClick={() => navigate(appPath())}>Retour à Aujourd’hui</Button>
        </Card>
      </Shell>
    )
  }

  const meal = planned && planned.meal.recipeId === recipe.id ? planned.meal : null
  const planScale = meal?.portions ?? 1
  const view: RecipeView = {
    recipe,
    nutrition: recipeEntryNutrients(recipe.nutrition, planScale),
    scale: recipeScale(recipe.servings, planScale, profile.householdSize),
    householdSize: profile.householdSize,
  }
  const canTick =
    !!meal &&
    planned!.plan.status === 'active' &&
    planDayIndex(planned!.plan.startDate, planned!.plan.days, today) === meal.day
  const entry = meal ? planMealEntry(meal, recipe, today) : null
  const alreadyEaten = !!entry && todayEntries.some((e) => e.planKey === entry.planKey)
  const eatenKcal = dayNutrients(todayEntries).kcal

  const tick = async () => {
    if (!entry) return
    await setPlanMealEaten(entry, true)
    setStage('saved')
  }

  return (
    <Shell
      title={TITLES[stage]}
      leading={stage === 'overview' ? 'back' : 'close'}
      onBack={stage === 'overview' || stage === 'saved' ? back : () => (stage === 'cooking' ? setStage('overview') : back())}
      hideBar={stage === 'saved'}
    >
      {stage === 'overview' && <RecipeOverview view={view} onStart={() => { setStep(0); setStage('cooking') }} />}
      {stage === 'cooking' && (
        <CookingView
          view={view}
          step={step}
          timers={timers}
          onStep={setStep}
          onFinish={() => setStage('done')}
          onBackToOverview={() => setStage('overview')}
        />
      )}
      {stage === 'done' && (
        <RecipeDone view={view} canTick={canTick} alreadyEaten={alreadyEaten} onTick={tick} onLeave={() => navigate(appPath())} />
      )}
      {stage === 'saved' && (
        <RecipeSaved view={view} eatenKcal={eatenKcal} kcalTarget={profile.kcalTarget} onLeave={() => navigate(appPath())} />
      )}
    </Shell>
  )
}

type ShellProps = {
  title?: string
  leading?: 'back' | 'close'
  onBack: () => void
  hideBar?: boolean
  children: React.ReactNode
}

/** Full-screen frame of the recipe flow (no tab bar: the person is cooking). */
function Shell({ title = '', leading = 'back', onBack, hideBar, children }: ShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-05 bg-bg px-05 pt-04 pb-06 text-text lg:px-06">
      {!hideBar && (
        <header className="flex items-center gap-03">
          <IconButton icon={leading === 'back' ? 'back' : 'x'} label={leading === 'back' ? 'Retour' : 'Fermer'} onClick={onBack} />
          <p className="flex-1 text-center text-title-3 text-text">{title}</p>
          <span className="size-10" aria-hidden />
        </header>
      )}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
