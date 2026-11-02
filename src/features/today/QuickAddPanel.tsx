import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { Icon } from '../../components/Icon'
import { QuantityStepper } from '../../components/QuantityStepper'
import { SearchField } from '../../components/SearchField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { SidePanel } from '../../components/SidePanel'
import { TextField } from '../../components/TextField'
import type { JournalEntry } from '../../data/db'
import type { IndexedFood, IndexedRecipe, ReferenceData } from '../../data/reference'
import { searchFoods } from '../../data/search'
import { defaultSlot, foodEntryNutrients, recipeEntryNutrients } from '../../domain/journal'
import { normalize } from '../../domain/text'
import type { IsoDate, MealSlot, Nutrients } from '../../domain/types'
import { formatDecimal, formatInt } from '../format'
import { SLOT_SHORT_LABELS, formatPortions } from '../plan/labels'

type Picked = { kind: 'food'; food: IndexedFood } | { kind: 'recipe'; recipe: IndexedRecipe }

export type QuickAddPanelProps = {
  data: ReferenceData
  date: IsoDate
  onAdd: (entry: JournalEntry) => void
  onClose: () => void
}

const SLOT_OPTIONS = (Object.keys(SLOT_SHORT_LABELS) as MealSlot[]).map((value) => ({
  value,
  label: SLOT_SHORT_LABELS[value],
}))
const GRAM_PRESETS = [50, 100, 150, 200]
const MAX_FOODS = 8
const MAX_RECIPES = 3

/** Quick add: search a food or a recipe, a quantity, done. Built for under 10 seconds. */
export function QuickAddPanel({ data, date, onAdd, onClose }: QuickAddPanelProps) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Picked | null>(null)
  const [slot, setSlot] = useState<MealSlot>(() => defaultSlot(new Date().getHours()))
  const [grams, setGrams] = useState('100')
  const [portions, setPortions] = useState(1)

  const results = useMemo(() => {
    const key = normalize(query).trim()
    if (!key) return { recipes: [], foods: [] }
    return {
      recipes: [...data.recipes.values()].filter((r) => normalize(r.title).includes(key)).slice(0, MAX_RECIPES),
      foods: searchFoods(data.foods.values(), query, MAX_FOODS),
    }
  }, [data, query])

  const quantity = picked?.kind === 'food' ? Number(grams.replace(',', '.')) : portions
  const valid = Number.isFinite(quantity) && quantity > 0
  let nutrients: Nutrients | null = null
  if (picked && valid) {
    nutrients =
      picked.kind === 'food'
        ? foodEntryNutrients(picked.food.per100g, quantity)
        : recipeEntryNutrients(picked.recipe.nutrition, quantity)
  }

  function pick(next: Picked) {
    setPicked(next)
    setGrams('100')
    setPortions(1)
  }

  function add() {
    if (!picked || !nutrients) return
    onAdd({
      date,
      slot,
      kind: picked.kind,
      label: picked.kind === 'food' ? picked.food.name : picked.recipe.title,
      ...(picked.kind === 'food' ? { foodId: picked.food.id } : { recipeId: picked.recipe.id }),
      quantity,
      nutrients,
    })
  }

  return (
    <SidePanel title="J’ai mangé autre chose" onClose={onClose} initialFocus="input">
      {!picked ? (
        <>
          <SearchField
            label="Chercher un aliment ou une recette"
            placeholder="Chercher un aliment ou une recette"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query.trim() && results.recipes.length + results.foods.length === 0 && (
            <p className="text-body text-text-muted">
              Rien trouvé. Essaie avec un autre mot, par exemple « pomme » ou « riz ».
            </p>
          )}
          <ul className="flex flex-col gap-02">
            {results.recipes.map((recipe) => (
              <li key={recipe.id}>
                <ResultRow
                  title={recipe.title}
                  detail={`Recette · ${formatInt(recipe.nutrition.kcal)} kcal par portion`}
                  onClick={() => pick({ kind: 'recipe', recipe })}
                />
              </li>
            ))}
            {results.foods.map((food) => (
              <li key={food.id}>
                <ResultRow
                  title={food.name}
                  detail={`${formatInt(food.per100g.kcal)} kcal pour 100 g`}
                  onClick={() => pick({ kind: 'food', food })}
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="flex w-fit items-center gap-01 text-body-sm text-text-muted"
          >
            <Icon name="back" size={16} />
            Chercher autre chose
          </button>
          <p className="text-title-3 text-text">{picked.kind === 'food' ? picked.food.name : picked.recipe.title}</p>

          {picked.kind === 'food' ? (
            <div className="flex flex-col gap-03">
              <TextField
                label="Quantité"
                suffix="g"
                inputMode="decimal"
                value={grams}
                onChange={(event) => setGrams(event.target.value)}
                aria-invalid={!valid}
              />
              <div className="flex flex-wrap gap-02" role="group" aria-label="Quantités courantes">
                {GRAM_PRESETS.map((preset) => (
                  <Chip
                    key={preset}
                    label={`${preset} g`}
                    selected={quantity === preset}
                    onClick={() => setGrams(String(preset))}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-03">
              <span className="text-label text-text">Portions</span>
              <QuantityStepper
                label="Portions"
                value={portions}
                min={0.25}
                max={6}
                step={0.25}
                format={formatPortions}
                onChange={setPortions}
              />
            </div>
          )}

          <div className="flex flex-col gap-02">
            <span className="text-label text-text">Repas</span>
            <SegmentedControl label="Repas" options={SLOT_OPTIONS} value={slot} onChange={setSlot} />
          </div>

          <p className="rounded-02 bg-surface p-04 text-body text-text shadow-pressed" aria-live="polite">
            {nutrients
              ? `${formatInt(nutrients.kcal)} kcal · P ${formatDecimal(nutrients.protein)} g · G ${formatDecimal(nutrients.carbs)} g · L ${formatDecimal(nutrients.fat)} g`
              : 'Entre une quantité pour voir les calories.'}
          </p>

          <Button fullWidth icon="plus" disabled={!nutrients} onClick={add}>
            Ajouter au journal
          </Button>
        </>
      )}
    </SidePanel>
  )
}

function ResultRow({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-03 rounded-02 bg-surface px-04 py-03 text-left shadow-raised-sm transition-shadow duration-[var(--duration-fast)] hover:shadow-raised active:shadow-pressed"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-label text-text">{title}</span>
        <span className="text-caption text-text-muted">{detail}</span>
      </span>
      <Icon name="chevron-right" size={20} className="text-text-muted" />
    </button>
  )
}
