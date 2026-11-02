import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { formatInt } from '../format'
import { NutritionRow } from './RecipeOverview'
import type { RecipeView } from './types'

export type RecipeDoneProps = {
  view: RecipeView
  /** The meal can be ticked in today's journal (it is today's planned meal). */
  canTick: boolean
  alreadyEaten: boolean
  onTick: () => void
  onLeave: () => void
}

/** Figma 06 Fin de recette: no portions to enter, the dish is the planned one. */
export function RecipeDone({ view, canTick, alreadyEaten, onTick, onLeave }: RecipeDoneProps) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-05">
      <div className="flex flex-col gap-02">
        <h1 className="text-title-1 text-text">C’est prêt !</h1>
        <p className="text-body text-text-muted">Bon appétit. Voici ce que contient ton repas.</p>
      </div>
      <NutritionRow nutrition={view.nutrition} />
      <div className="mt-auto flex flex-col gap-03 pt-05">
        {canTick && !alreadyEaten ? (
          <>
            <Button fullWidth icon="check" onClick={onTick}>
              J’ai mangé ce repas
            </Button>
            <Button fullWidth variant="secondary" onClick={onLeave}>
              Pas tout de suite
            </Button>
          </>
        ) : (
          <>
            {alreadyEaten && <p className="text-body-sm text-focus-text">Ce repas est déjà noté dans ton journal.</p>}
            <Button fullWidth onClick={onLeave}>
              Terminer
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export type RecipeSavedProps = { view: RecipeView; eatenKcal: number; kcalTarget: number; onLeave: () => void }

/** Figma 07 Confirmation, without the stock update (no stock in the v2). */
export function RecipeSaved({ view, eatenKcal, kcalTarget, onLeave }: RecipeSavedProps) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center gap-05 pt-06 text-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-surface text-focus-text shadow-raised">
        <Icon name="check" size={24} />
      </span>
      <div className="flex flex-col gap-02" role="status">
        <h1 className="text-title-1 text-text">Repas enregistré</h1>
        <p className="text-body text-text-muted">
          {view.recipe.title}, {formatInt(view.nutrition.kcal)} kcal
        </p>
        <p className="text-body-sm text-text-muted">
          Tu en es à {formatInt(eatenKcal)} sur {formatInt(kcalTarget)} kcal aujourd’hui.
        </p>
      </div>
      <div className="mt-auto w-full pt-05">
        <Button fullWidth onClick={onLeave}>
          Retour à Aujourd’hui
        </Button>
      </div>
    </div>
  )
}
