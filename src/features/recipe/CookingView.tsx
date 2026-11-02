import { useEffect } from 'react'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { ProgressBar } from '../../components/ProgressBar'
import { formatClock } from '../../domain/timer'
import { IngredientList } from './IngredientList'
import type { RecipeView } from './types'
import type { StepTimers } from './useStepTimers'

export type CookingViewProps = {
  view: RecipeView
  step: number
  timers: StepTimers
  onStep: (step: number) => void
  onFinish: () => void
  onBackToOverview: () => void
}

/** Figma 05 Étape n sur N: the step text, its timer if any, previous / next. From 1024 px the ingredients stay on the left. */
export function CookingView({ view, step, timers, onStep, onFinish, onBackToOverview }: CookingViewProps) {
  const { recipe, scale } = view
  const steps = recipe.steps
  const current = steps[step]!
  const last = step === steps.length - 1
  const goPrevious = () => (step === 0 ? onBackToOverview() : onStep(step - 1))
  const goNext = () => (last ? onFinish() : onStep(step + 1))

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return
      if (event.key === 'ArrowLeft') goPrevious()
      if (event.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const totalMs = current.timerMinutes ? current.timerMinutes * 60_000 : 0
  const remaining = timers.remainingMs(step, totalMs)
  const running = timers.running(step)
  const done = totalMs > 0 && remaining === 0
  const others = timers.finished.filter((s) => s !== step)

  return (
    <div className="flex flex-1 flex-col gap-05 lg:grid lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-start lg:gap-06">
      <aside aria-label="Ingrédients" className="hidden flex-col gap-03 lg:flex">
        <h2 className="text-title-3 text-text">Ingrédients</h2>
        <IngredientList recipe={recipe} scale={scale} />
      </aside>

      <div className="flex flex-1 flex-col gap-05">
        <ProgressBar value={step + 1} max={steps.length} label="Avancement de la recette" valueText={`Étape ${step + 1} sur ${steps.length}`} />

        <div className="flex flex-col gap-03">
          <p className="text-overline-caps text-focus-text">Étape {step + 1}</p>
          <p className="text-body-lg text-text lg:text-title-2">{current.text}</p>
        </div>

        {others.map((s) => (
          <p key={s} role="status" className="flex items-center justify-between gap-03 rounded-02 bg-surface p-03 text-body-sm text-text shadow-pressed">
            Le minuteur de l’étape {s + 1} est terminé.
            <button type="button" onClick={() => timers.dismiss(s)} className="min-h-11 px-03 text-label text-focus-text">
              OK
            </button>
          </p>
        ))}

        {current.timerMinutes && (
          <div className="flex flex-col items-center gap-02 py-05 text-center">
            <Icon name="timer" size={24} className="text-focus-text" />
            <p className="text-display text-text" aria-hidden>
              {formatClock(remaining)}
            </p>
            <p className="text-caption text-text-muted" role="status">
              {done ? 'Minuteur terminé !' : 'Minuteur de l’étape'}
            </p>
            <div className="mt-02 flex flex-wrap justify-center gap-03">
              <Button
                variant="secondary"
                onClick={() => (running ? timers.pause(step, totalMs) : timers.start(step, totalMs))}
                disabled={done}
              >
                {running ? 'Mettre en pause' : remaining < totalMs ? 'Reprendre' : 'Lancer le minuteur'}
              </Button>
              {(remaining < totalMs || done) && (
                <Button variant="secondary" onClick={() => timers.reset(step)}>
                  Recommencer
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto flex gap-03 pt-05">
          <Button variant="secondary" className="flex-1" onClick={goPrevious}>
            Précédent
          </Button>
          <Button className="flex-1" onClick={goNext}>
            {last ? 'Terminer' : 'Suivant'}
          </Button>
        </div>
      </div>
    </div>
  )
}
