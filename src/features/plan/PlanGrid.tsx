import { ClayIcon } from '../../components/ClayIcon'
import { cn } from '../../components/cn'
import { Icon } from '../../components/Icon'
import { ProgressBar } from '../../components/ProgressBar'
import { addDays } from '../../domain/dates'
import { formatInt } from '../format'
import { SLOT_LABELS, formatDayLong, formatWeekday } from './labels'
import type { PlanState } from './usePlan'
import { dayTotal, mealKcal, mealsOfDay, recipeClay } from './view'

type Ready = Extract<PlanState, { status: 'ready' }>

export type PlanGridProps = {
  state: Ready
  /** The meal whose swap panel is open. */
  selected: { day: number; index: number } | null
  onSwap: (day: number, index: number) => void
}

const WEEK = 7

/** Desktop: days in columns, meals in rows. A 14-day plan is two blocks of 7 columns. */
export function PlanGrid({ state, selected, onSwap }: PlanGridProps) {
  const { plan } = state
  const weeks = Math.ceil(plan.days / WEEK)
  const rows = plan.mealsPerDay

  return (
    <div className="hidden flex-col gap-06 lg:flex">
      {Array.from({ length: weeks }, (_, week) => {
        const days = Array.from({ length: Math.min(WEEK, plan.days - week * WEEK) }, (_, i) => week * WEEK + i)
        return (
          <section key={week} aria-label={weeks > 1 ? `Semaine ${week + 1}` : 'Semaine'} className="flex flex-col gap-03">
            {weeks > 1 && <h2 className="text-title-3 text-text">Semaine {week + 1}</h2>}
            {/* One row for the day header, then one per meal: columns use a subgrid so meals line up across days. */}
            <div
              className="grid gap-x-03 gap-y-02 overflow-x-auto pb-02 [grid-template-columns:repeat(7,minmax(120px,1fr))]"
              style={{ gridTemplateRows: `auto repeat(${rows}, auto)` }}
            >
              {days.map((day) => (
                <DayColumn key={day} state={state} day={day} selected={selected} onSwap={onSwap} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

type DayColumnProps = { state: Ready; day: number } & Pick<PlanGridProps, 'selected' | 'onSwap'>

function DayColumn({ state, day, selected, onSwap }: DayColumnProps) {
  const { plan, meals, data } = state
  const date = addDays(plan.startDate, day)
  const total = dayTotal(meals, data.recipes, day)

  return (
    <div
      className="grid min-w-0 grid-rows-subgrid gap-y-02"
      style={{ gridRow: `span ${plan.mealsPerDay + 1}` }}
      role="group"
      aria-label={formatDayLong(date)}
    >
      <div className="flex flex-col gap-01 px-01">
        <p className="text-overline-caps text-text-muted">
          {formatWeekday(date)} {Number(date.slice(8))}
        </p>
        <p className="text-body-sm text-text">{formatInt(total)} kcal</p>
        <ProgressBar
          value={total}
          max={plan.kcalTarget}
          label={`Calories prévues, ${formatDayLong(date)}`}
          valueText={`${formatInt(total)} sur ${formatInt(plan.kcalTarget)} kcal`}
        />
      </div>
      {mealsOfDay(meals, day).map((meal) => {
        const recipe = data.recipes.get(meal.recipeId)!
        const clay = recipeClay(recipe)
        const active = selected?.day === day && selected.index === meal.index
        return (
          <button
            key={meal.index}
            type="button"
            aria-label={`${SLOT_LABELS[meal.slot]} : ${recipe.title}, changer`}
            onClick={() => onSwap(day, meal.index)}
            className={cn(
              'flex flex-col items-start gap-02 rounded-02 bg-surface p-03 text-left',
              'transition-shadow duration-[var(--duration-fast)] ease-out',
              active ? 'shadow-pressed' : 'shadow-flat hover:shadow-raised-sm',
            )}
          >
            <span className="flex w-full items-center justify-between gap-02">
              <span className="text-caption text-text-muted">{SLOT_LABELS[meal.slot]}</span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-01 bg-lightbrown-p">
                {clay ? <ClayIcon id={clay} size={24} /> : <Icon name="cooking-pot" size={16} className="text-text-muted" />}
              </span>
            </span>
            <span className="text-body-sm text-text">{recipe.title}</span>
            <span className="mt-auto text-caption text-text-muted">{formatInt(mealKcal(recipe, meal.portions))} kcal</span>
          </button>
        )
      })}
    </div>
  )
}
