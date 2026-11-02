import { Button } from '../../components/Button'
import { ClayIcon } from '../../components/ClayIcon'
import { Icon } from '../../components/Icon'
import { MacroStat } from '../../components/MacroStat'
import { formatInt } from '../format'
import { recipeClay } from '../plan/view'
import { IngredientList } from './IngredientList'
import { EQUIPMENT_LABELS } from './labels'
import type { RecipeView } from './types'

export type RecipeOverviewProps = { view: RecipeView; onStart: () => void }

/** Figma 03 Fiche recette + 04 Avant de commencer, merged: with no stock the two screens listed the same ingredients. */
export function RecipeOverview({ view, onStart }: RecipeOverviewProps) {
  const { recipe, nutrition, scale, householdSize } = view
  const clay = recipeClay(recipe)

  return (
    <div className="flex flex-col gap-05 lg:grid lg:grid-cols-2 lg:items-start lg:gap-06">
      <div className="flex flex-col gap-05">
        <div className="flex h-48 items-center justify-center rounded-03 bg-lightbrown-p lg:h-72">
          {clay ? <ClayIcon id={clay} size={120} /> : <Icon name="cooking-pot" size={24} className="text-text-muted" />}
        </div>
        <div className="flex flex-col gap-02">
          <h1 className="text-title-1 text-text lg:text-display">{recipe.title}</h1>
          <p className="flex items-center gap-04 text-body-sm text-text-muted">
            <span className="flex items-center gap-01">
              <Icon name="clock" size={16} />
              {recipe.minutes} min
            </span>
            <span className="flex items-center gap-01">
              <Icon name="flame" size={16} />
              {formatInt(nutrition.kcal)} kcal
            </span>
          </p>
        </div>
        <section aria-labelledby="nutrition-title" className="flex flex-col gap-03">
          <h2 id="nutrition-title" className="text-title-3 text-text">
            Nutrition de ton repas
          </h2>
          <NutritionRow nutrition={nutrition} />
        </section>
      </div>

      <div className="flex flex-col gap-05">
        <section aria-labelledby="ingredients-title" className="flex flex-col gap-03">
          <div className="flex items-baseline justify-between gap-03">
            <h2 id="ingredients-title" className="text-title-2 text-text">
              Ingrédients
            </h2>
            {householdSize > 1 && <span className="text-body-sm text-text-muted">Pour {householdSize} personnes</span>}
          </div>
          <IngredientList recipe={recipe} scale={scale} />
        </section>

        {recipe.equipment.length > 0 && (
          <section aria-labelledby="equipment-title" className="flex flex-col gap-03">
            <h2 id="equipment-title" className="text-title-3 text-text">
              Matériel
            </h2>
            <ul className="flex flex-wrap gap-02">
              {recipe.equipment.map((id) => {
                const { label, clay: equipmentClay } = EQUIPMENT_LABELS[id] ?? { label: id }
                return (
                  <li
                    key={id}
                    className="inline-flex items-center gap-02 rounded-full bg-surface py-01 pr-04 pl-01 text-body-sm text-text shadow-raised-sm"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-darkgreen-200">
                      {equipmentClay && <ClayIcon id={equipmentClay} size={24} />}
                    </span>
                    {label}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <Button fullWidth onClick={onStart}>
          Commencer
        </Button>
      </div>
    </div>
  )
}

export function NutritionRow({ nutrition }: { nutrition: RecipeView['nutrition'] }) {
  return (
    <div className="flex gap-02">
      <MacroStat value={formatInt(nutrition.kcal)} label="kcal" />
      <MacroStat value={`${formatInt(nutrition.protein)} g`} label="Protéines" />
      <MacroStat value={`${formatInt(nutrition.carbs)} g`} label="Glucides" />
      <MacroStat value={`${formatInt(nutrition.fat)} g`} label="Lipides" />
    </div>
  )
}
