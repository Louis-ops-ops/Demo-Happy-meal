import { useEffect, useRef, type ReactNode } from 'react'
import { ClayIcon } from '../../components/ClayIcon'
import { cn } from '../../components/cn'
import { IconButton } from '../../components/IconButton'
import { StepIndicator } from '../../components/StepIndicator'

/** Number of setting steps shown in the StepIndicator (metrics, goal, diet, household, duration). */
export const SETTING_STEPS = 5

export type OnboardingLayoutProps = {
  title: string
  intro?: ReactNode
  /** 1-based setting step for the indicator; omit on splash, intro and recap. */
  step?: number
  onBack?: () => void
  /** Shows "Passer" (every step but the metrics). */
  onSkip?: () => void
  /** Bottom action bar content (usually the primary Button). */
  action?: ReactNode
  /** Recap uses a wider card on desktop, with two columns. */
  wide?: boolean
  children?: ReactNode
}

/** Figma onboarding frame (O3, O4): header, intro, content, sticky action bar. Centered card on desktop. */
export function OnboardingLayout({ title, intro, step, onBack, onSkip, action, wide, children }: OnboardingLayoutProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Each step is a new "page": move focus to its title for screen readers and keyboards.
  useEffect(() => {
    headingRef.current?.focus()
  }, [title])

  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg lg:flex lg:items-center lg:justify-center lg:px-06 lg:py-06">
      <Decoration />
      <div
        className={cn(
          'relative mx-auto flex min-h-dvh w-full flex-col bg-surface lg:min-h-0 lg:rounded-03 lg:shadow-raised',
          wide ? 'max-w-[880px]' : 'max-w-[520px]',
        )}
      >
        <main className="flex flex-1 flex-col gap-05 px-05 pt-06 pb-05 lg:px-06">
          {(step !== undefined || onBack || onSkip) && (
            <div className="flex min-h-11 items-center justify-between gap-03">
              <div className="flex items-center gap-04">
                {onBack && <IconButton icon="back" label="Étape précédente" onClick={onBack} />}
                {step !== undefined && <StepIndicator current={step} total={SETTING_STEPS} />}
              </div>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="min-h-11 rounded-02 px-02 text-label text-focus-text hover:text-text"
                >
                  Passer
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-02">
            <h1 ref={headingRef} tabIndex={-1} className="text-title-1 text-text outline-none">
              {title}
            </h1>
            {intro && <p className="text-body text-text-muted">{intro}</p>}
          </div>

          {children}
        </main>

        {action && (
          <div className="sticky bottom-0 flex flex-col gap-03 bg-surface px-05 pt-03 pb-[calc(var(--spacing-06)+env(safe-area-inset-bottom))] lg:static lg:rounded-b-03 lg:px-06 lg:pb-06">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

/** A few clay foods around the card on large screens, as in the DA (decorative only). */
function Decoration() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      <ClayIcon id="tomate" size={96} className="absolute top-[12%] left-[10%] rotate-6" />
      <ClayIcon id="courgette" size={112} className="absolute bottom-[14%] left-[14%] -rotate-12" />
      <ClayIcon id="oeuf" size={80} className="absolute top-[18%] right-[12%] rotate-12" />
      <ClayIcon id="poivre" size={88} className="absolute right-[10%] bottom-[16%] -rotate-6" />
    </div>
  )
}
