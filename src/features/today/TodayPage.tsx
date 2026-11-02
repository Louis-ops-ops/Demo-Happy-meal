import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { IconButton } from '../../components/IconButton'
import {
  addJournalEntry,
  deleteJournalEntry,
  planKey,
  setPlanMealEaten,
  type JournalEntry,
} from '../../data/db'
import { appPath } from '../../platform'
import { formatInt } from '../format'
import { SLOT_LABELS, formatDayLong } from '../plan/labels'
import { planMealEntry } from './entries'
import { DaySummary } from './DaySummary'
import { MealItem } from './MealItem'
import { QuickAddPanel } from './QuickAddPanel'
import { useToday } from './useToday'

/** Today tab: the meals of the plan to tick, extras from the quick add, and kcal / macros against the targets. */
export function TodayPage() {
  const navigate = useNavigate()
  const state = useToday()
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('')

  if (state.status === 'loading') return <p className="text-body text-text-muted">Chargement…</p>
  if (state.status === 'error') {
    return (
      <Card className="max-w-[70ch]" role="alert">
        <p className="text-body-lg text-text">Impossible de charger les recettes.</p>
        <p className="mt-02 text-body-sm text-text-muted">{state.message}</p>
      </Card>
    )
  }

  const { today, profile, data, current, day, hasDraft, entries, eaten } = state
  const meals = current && day !== null ? current.meals.filter((m) => m.day === day) : []
  const extras = entries.filter((e) => e.kind !== 'plan')
  const eatenKeys = new Set(entries.flatMap((e) => (e.planKey ? [e.planKey] : [])))

  const add = async (entry: JournalEntry) => {
    await addJournalEntry(entry)
    setAdding(false)
    setNotice(`Ajouté : ${entry.label}.`)
  }

  return (
    <section className="flex flex-col gap-05">
      <header className="flex flex-col gap-01">
        <p className="text-overline-caps text-text-muted first-letter:uppercase">{formatDayLong(today)}</p>
        <h1 className="text-display text-text">Aujourd’hui</h1>
      </header>

      <div className="grid gap-05 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="lg:order-2">
          <DaySummary eaten={eaten} kcalTarget={profile.kcalTarget} macros={profile.macros} />
        </div>

        <div className="flex flex-col gap-05 lg:order-1">
          {meals.length > 0 ? (
            <ul className="flex flex-col gap-05 md:grid md:grid-cols-2 lg:grid-cols-1">
              {meals.map((meal) => {
                const recipe = data.recipes.get(meal.recipeId)
                if (!recipe) return null
                const key = planKey(meal.planId, meal.day, meal.index)
                return (
                  <MealItem
                    key={meal.index}
                    slot={meal.slot}
                    recipe={recipe}
                    portions={meal.portions}
                    eaten={eatenKeys.has(key)}
                    onEaten={(value) => setPlanMealEaten(planMealEntry(meal, recipe, today), value)}
                    onOpen={() => navigate(appPath(`recette/${recipe.id}?repas=${key}`))}
                  />
                )
              })}
            </ul>
          ) : (
            <NoMeals
              hasPlan={!!current}
              hasDraft={hasDraft}
              onPlan={() => navigate(appPath(hasDraft || current ? 'plan' : 'plan/nouveau'))}
            />
          )}

          {extras.length > 0 && (
            <section aria-labelledby="extras-title" className="flex flex-col gap-02">
              <h2 id="extras-title" className="text-title-3 text-text">
                Ajouté en plus
              </h2>
              <ul className="flex flex-col gap-02">
                {extras.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-03 rounded-02 bg-surface p-03 shadow-flat">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-label text-text">{entry.label}</span>
                      <span className="text-caption text-text-muted">
                        {SLOT_LABELS[entry.slot]} · {quantityLabel(entry)} · {formatInt(entry.nutrients.kcal)} kcal
                      </span>
                    </div>
                    <IconButton
                      icon="trash"
                      label={`Retirer ${entry.label}`}
                      onClick={() => entry.id !== undefined && deleteJournalEntry(entry.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-col gap-02">
            <Button variant="secondary" icon="plus" onClick={() => setAdding(true)}>
              J’ai mangé autre chose
            </Button>
            <p role="status" className="text-body-sm text-focus-text empty:hidden">
              {notice}
            </p>
          </div>
        </div>
      </div>

      {adding && <QuickAddPanel data={data} date={today} onAdd={add} onClose={() => setAdding(false)} />}
    </section>
  )
}

const quantityLabel = (entry: JournalEntry) =>
  entry.kind === 'food' ? `${formatInt(entry.quantity)} g` : 'Recette'

type NoMealsProps = { hasPlan: boolean; hasDraft: boolean; onPlan: () => void }

function NoMeals({ hasPlan, hasDraft, onPlan }: NoMealsProps) {
  const copy = hasDraft
    ? { text: 'Ton plan attend ta validation pour apparaître ici.', action: 'Voir mon plan' }
    : hasPlan
      ? { text: 'Ton plan est terminé. Tu peux en préparer un nouveau quand tu veux.', action: 'Nouveau plan' }
      : { text: 'Pas encore de plan : crée-en un pour retrouver tes repas ici.', action: 'Créer mon plan' }

  return (
    <Card relief="pressed" className="flex flex-col items-start gap-04">
      <p className="text-body-lg text-text">{copy.text}</p>
      <Button icon="spark" onClick={onPlan}>
        {copy.action}
      </Button>
    </Card>
  )
}
