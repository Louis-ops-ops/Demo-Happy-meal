/** A step timer: running (ends at a timestamp), paused (time left) or idle (full duration). */
export type StepTimer = { endsAt: number } | { pausedMs: number } | null

export function timerRemainingMs(timer: StepTimer, now: number, totalMs: number): number {
  if (!timer) return totalMs
  if ('pausedMs' in timer) return timer.pausedMs
  return Math.max(0, timer.endsAt - now)
}

export const startTimer = (remainingMs: number, now: number): StepTimer => ({ endsAt: now + remainingMs })
export const pauseTimer = (remainingMs: number): StepTimer => ({ pausedMs: remainingMs })

export const isRunning = (timer: StepTimer): boolean => !!timer && 'endsAt' in timer

/** "05:00", rounding up so the display never shows 00:00 before the timer is really over. */
export function formatClock(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000)
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
