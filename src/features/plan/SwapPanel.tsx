import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { ClayIcon } from '../../components/ClayIcon'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../components/IconButton'
import { addDays } from '../../domain/dates'
import { swapCandidates } from '../../domain/plan'
import { SLOT_LABELS, formatDayLong } from './labels'
import type { PlanState } from './usePlan'
import { mealMeta, recipeClay } from './view'

type Ready = Extract<PlanState, { status: 'ready' }>

export type SwapPanelProps = {
  state: Ready
  day: number
  index: number
  onPick: (recipeId: string) => void
  onClose: () => void
}

const MAX_SHOWN = 5

/**
 * Alternatives for one meal. Full screen on mobile, side panel from 1024 px (no bottom sheet on desktop).
 * Moves focus inside, keeps Tab in the panel, closes with Escape and gives focus back to the meal.
 */
export function SwapPanel({ state, day, index, onPick, onClose }: SwapPanelProps) {
  const { plan, meals, input, allowed, data } = state
  const panel = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const opener = useRef<Element | null>(null)

  const meal = meals.find((m) => m.day === day && m.index === index)
  const current = meal ? data.recipes.get(meal.recipeId) : undefined

  const candidates = useMemo(
    () =>
      swapCandidates(input, meals, day, index, MAX_SHOWN * 3)
        .filter((c) => allowed.has(c.recipeId))
        .slice(0, MAX_SHOWN),
    [input, meals, day, index, allowed],
  )

  useEffect(() => {
    opener.current = document.activeElement
    heading.current?.focus()
    return () => {
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus()
    }
  }, [])

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panel.current) return
    const focusable = panel.current.querySelectorAll<HTMLElement>('button:not([disabled])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!meal || !current) return null

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 hidden bg-darkgreen-p/30 lg:block" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-title"
        onKeyDown={onKeyDown}
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg lg:left-auto lg:w-[420px] lg:shadow-raised"
      >
        <header className="flex items-start gap-03 px-05 pt-04 pb-03">
          <div className="flex min-w-0 flex-1 flex-col gap-01 pt-01">
            <p className="text-overline-caps text-text-muted">
              {SLOT_LABELS[meal.slot]} · {formatDayLong(addDays(plan.startDate, day))}
            </p>
            <h2 id="swap-title" ref={heading} tabIndex={-1} className="text-title-2 text-text outline-none">
              Changer ce repas
            </h2>
          </div>
          <IconButton icon="x" label="Fermer" onClick={onClose} />
        </header>

        <div className="flex flex-col gap-05 px-05 pb-06">
          <section aria-label="Repas actuel" className="flex flex-col gap-02">
            <p className="text-body-sm text-text-muted">Repas actuel</p>
            <div className="flex items-center gap-03 rounded-02 bg-surface p-03 shadow-pressed">
              <Thumb clay={recipeClay(current)} />
              <div className="flex min-w-0 flex-col gap-01">
                <p className="text-label text-text">{current.title}</p>
                <p className="text-body-sm text-text-muted">{mealMeta(current, meal.portions)}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="swap-list" className="flex flex-col gap-03">
            <h3 id="swap-list" className="text-title-3 text-text">
              Autres idées
            </h3>
            <p className="text-body-sm text-text-muted">
              Des repas aux calories proches. La portion s’ajuste pour que ta journée reste équilibrée.
            </p>
            {candidates.length === 0 ? (
              <p className="rounded-02 bg-surface p-04 text-body text-text-muted shadow-pressed">
                Aucune autre recette ne convient pour ce repas avec tes réglages.
              </p>
            ) : (
              <ul className="flex flex-col gap-03">
                {candidates.map((candidate) => {
                  const recipe = data.recipes.get(candidate.recipeId)!
                  return (
                    <li key={candidate.recipeId}>
                      <button
                        type="button"
                        onClick={() => onPick(candidate.recipeId)}
                        className="flex w-full items-center gap-03 rounded-03 bg-surface p-03 text-left shadow-raised transition-shadow duration-[var(--duration-fast)] hover:shadow-raised-sm active:shadow-pressed"
                      >
                        <Thumb clay={recipeClay(recipe)} />
                        <span className="flex min-w-0 flex-1 flex-col gap-01">
                          <span className="text-label text-text">{recipe.title}</span>
                          <span className="text-body-sm text-text-muted">{mealMeta(recipe, candidate.portions)}</span>
                          {candidate.haveMatches > 0 && (
                            <span className="flex items-center gap-01 text-caption text-focus-text">
                              <Icon name="check" size={16} />
                              Avec ce que tu as déjà
                            </span>
                          )}
                        </span>
                        <Icon name="chevron-right" size={20} className="text-text-muted" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function Thumb({ clay }: { clay: ReturnType<typeof recipeClay> }) {
  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-02 bg-lightbrown-p">
      {clay ? <ClayIcon id={clay} size={40} /> : <Icon name="cooking-pot" size={24} className="text-text-muted" />}
    </span>
  )
}
