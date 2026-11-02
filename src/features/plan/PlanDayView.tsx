import { useEffect } from 'react'
import { Card } from '../../components/Card'
import { cn } from '../../components/cn'
import { IconButton } from '../../components/IconButton'
import { ProgressBar } from '../../components/ProgressBar'
import { RecipeCard } from '../../components/RecipeCard'
import { addDays } from '../../domain/dates'
import { formatInt } from '../format'
import { SLOT_LABELS, formatDayLong, formatWeekday } from './labels'
import type { PlanState } from './usePlan'
import { dayTotal, mealMeta, mealsOfDay, recipeClay } from './view'

type Ready = Extract<PlanState, { status: 'ready' }>

export type PlanDayViewProps = {
  state: Ready
  day: number
  onDay: (day: number) => void
  onSwap: (day: number, index: number) => void
  /** Arrow keys are off while a panel is open. */
  keysEnabled: boolean
}

/** Mobile and tablet: a day selector, the day total against the target, and the day's meals. */
export function PlanDayView({ state, day, onDay, onSwap, keysEnabled }: PlanDayViewProps) {
  const { plan, meals, data } = state
  const total = dayTotal(meals, data.recipes, day)
  const date = addDays(plan.startDate, day)

  useEffect(() => {
    if (!keysEnabled) return
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      // The week grid takes over from 1024 px.
      if (window.matchMedia('(min-width: 64rem)').matches) return
      if (event.key === 'ArrowLeft') onDay(Math.max(0, day - 1))
      if (event.key === 'ArrowRight') onDay(Math.min(plan.days - 1, day + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keysEnabled, day, plan.days, onDay])

  return (
    <div className="flex flex-col gap-05 lg:hidden">
      <div
        role="group"
        aria-label="Jours du plan"
        className="-mx-05 flex gap-03 overflow-x-auto px-05 pt-01 pb-03 [scrollbar-width:none]"
      >
        {Array.from({ length: plan.days }, (_, d) => {
          const selected = d === day
          const dayDate = addDays(plan.startDate, d)
          return (
            <button
              key={d}
              type="button"
              aria-pressed={selected}
              aria-label={formatDayLong(dayDate)}
              onClick={() => onDay(d)}
              ref={(node) => {
                if (selected) node?.scrollIntoView({ inline: 'center', block: 'nearest' })
              }}
              className={cn(
                'flex h-16 min-w-14 shrink-0 flex-col items-center justify-center gap-01 rounded-02 bg-surface px-03',
                'transition-[box-shadow,color] duration-[var(--duration-fast)] ease-out',
                selected ? 'text-focus-text shadow-pressed' : 'text-text shadow-raised-sm',
              )}
            >
              <span className="text-caption">{formatWeekday(dayDate)}</span>
              <span className="text-title-3">{Number(dayDate.slice(8))}</span>
            </button>
          )
        })}
      </div>

      <Card className="flex flex-col gap-03">
        <h2 className="text-title-2 text-text first-letter:uppercase">{formatDayLong(date)}</h2>
        <p className="flex items-baseline gap-02">
          <span className="text-title-1 text-text">{formatInt(total)}</span>
          <span className="text-body-sm text-text-muted">kcal prévues · cible {formatInt(plan.kcalTarget)}</span>
        </p>
        <ProgressBar
          value={total}
          max={plan.kcalTarget}
          label="Calories prévues ce jour"
          valueText={`${formatInt(total)} sur ${formatInt(plan.kcalTarget)} kcal`}
        />
      </Card>

      <ul className="flex flex-col gap-04 md:grid md:grid-cols-2">
        {mealsOfDay(meals, day).map((meal) => {
          const recipe = data.recipes.get(meal.recipeId)!
          return (
            <li key={meal.index} className="flex flex-col gap-02">
              <p className="text-overline-caps text-text-muted">{SLOT_LABELS[meal.slot]}</p>
              <RecipeCard
                title={recipe.title}
                meta={mealMeta(recipe, meal.portions)}
                clay={recipeClay(recipe)}
                action={
                  <IconButton
                    icon="refresh-cw"
                    label={`Changer ${recipe.title}`}
                    onClick={() => onSwap(meal.day, meal.index)}
                  />
                }
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
