import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, isIsoDate, toIsoDate } from './dates'

describe('dates', () => {
  it('adds days across months, years and leap days', () => {
    expect(addDays('2026-11-02', 112)).toBe('2027-02-22')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('counts days between two dates, ignoring DST', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-11-02', '2026-10-26')).toBe(-7)
  })

  it('validates ISO dates', () => {
    expect(isIsoDate('2026-11-02')).toBe(true)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('02/11/2026')).toBe(false)
    expect(() => addDays('nope', 1)).toThrow()
  })

  it('formats a local JS date', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
