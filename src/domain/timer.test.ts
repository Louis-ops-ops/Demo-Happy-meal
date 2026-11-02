import { describe, expect, it } from 'vitest'
import { formatClock, isRunning, pauseTimer, startTimer, timerRemainingMs } from './timer'

const FIVE_MIN = 5 * 60_000

describe('step timer', () => {
  it('is full when idle, counts down when running, holds when paused', () => {
    expect(timerRemainingMs(null, 1_000, FIVE_MIN)).toBe(FIVE_MIN)
    const running = startTimer(FIVE_MIN, 10_000)
    expect(isRunning(running)).toBe(true)
    expect(timerRemainingMs(running, 70_000, FIVE_MIN)).toBe(FIVE_MIN - 60_000)
    expect(timerRemainingMs(running, 10_000 + FIVE_MIN + 5_000, FIVE_MIN)).toBe(0)
    const paused = pauseTimer(123_000)
    expect(isRunning(paused)).toBe(false)
    expect(isRunning(null)).toBe(false)
    expect(timerRemainingMs(paused, 999_999, FIVE_MIN)).toBe(123_000)
  })
})

describe('formatClock', () => {
  it('shows minutes and seconds, rounding seconds up', () => {
    expect(formatClock(FIVE_MIN)).toBe('05:00')
    expect(formatClock(59_001)).toBe('01:00')
    expect(formatClock(61_000)).toBe('01:01')
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(-5)).toBe('00:00')
    expect(formatClock(600 * 60_000)).toBe('600:00')
  })
})
