import { cn } from './cn'

export type StepIndicatorProps = {
  /** 1-based current step. */
  current: number
  total: number
  className?: string
}

/** Figma StepIndicator (33:3799): done = focus dot, current = primary pill, upcoming = darkgreen-300 dot. */
export function StepIndicator({ current, total, className }: StepIndicatorProps) {
  return (
    <div
      role="progressbar"
      aria-label="Progression"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Étape ${current} sur ${total}`}
      className={cn('flex items-center gap-02', className)}
    >
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1
        return (
          <span
            key={step}
            className={cn(
              'h-2 rounded-full transition-[width,background-color] duration-300 ease-out',
              step === current ? 'w-6 bg-primary' : 'w-2',
              step < current && 'bg-focus',
              step > current && 'bg-darkgreen-300',
            )}
          />
        )
      })}
    </div>
  )
}
