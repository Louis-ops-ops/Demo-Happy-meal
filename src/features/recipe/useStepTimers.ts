import { useCallback, useEffect, useRef, useState } from 'react'
import { isRunning, pauseTimer, startTimer, timerRemainingMs, type StepTimer } from '../../domain/timer'

export type StepTimers = {
  remainingMs: (step: number, totalMs: number) => number
  running: (step: number) => boolean
  start: (step: number, totalMs: number) => void
  pause: (step: number, totalMs: number) => void
  reset: (step: number) => void
  /** Steps whose timer ran out and was not looked at yet. */
  finished: number[]
  dismiss: (step: number) => void
}

/** One countdown per step; they keep running while the person moves to another step. */
export function useStepTimers(): StepTimers {
  const [timers, setTimers] = useState<Record<number, StepTimer>>({})
  const [now, setNow] = useState(() => Date.now())
  const [finished, setFinished] = useState<number[]>([])
  const notified = useRef(new Set<number>())
  const anyRunning = Object.values(timers).some(isRunning)

  useEffect(() => {
    if (!anyRunning) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [anyRunning])

  useEffect(() => {
    for (const [key, timer] of Object.entries(timers)) {
      const step = Number(key)
      if (timer && 'endsAt' in timer && timer.endsAt <= now && !notified.current.has(step)) {
        notified.current.add(step)
        setFinished((list) => [...list, step])
        navigator.vibrate?.([200, 100, 200])
      }
    }
  }, [timers, now])

  const set = (step: number, timer: StepTimer) => setTimers((current) => ({ ...current, [step]: timer }))

  return {
    remainingMs: useCallback((step, totalMs) => timerRemainingMs(timers[step] ?? null, now, totalMs), [timers, now]),
    running: useCallback((step) => isRunning(timers[step] ?? null), [timers]),
    start: (step, totalMs) => {
      notified.current.delete(step)
      const left = timerRemainingMs(timers[step] ?? null, Date.now(), totalMs)
      set(step, startTimer(left > 0 ? left : totalMs, Date.now()))
      setNow(Date.now())
    },
    pause: (step, totalMs) => set(step, pauseTimer(timerRemainingMs(timers[step] ?? null, Date.now(), totalMs))),
    reset: (step) => {
      notified.current.delete(step)
      setFinished((list) => list.filter((s) => s !== step))
      set(step, null)
    },
    finished,
    dismiss: (step) => setFinished((list) => list.filter((s) => s !== step)),
  }
}
