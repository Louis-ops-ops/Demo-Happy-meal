import { describe, expect, it } from 'vitest'
import { appPath, platform } from './platform'

describe('platform (web target)', () => {
  it('defaults to the web target with portfolio, demo and service worker', () => {
    expect(platform.target).toBe('web')
    expect(platform.hasPortfolio).toBe(true)
    expect(platform.hasDemo).toBe(true)
    expect(platform.hasServiceWorker).toBe(true)
  })

  it('builds app paths under /app', () => {
    expect(appPath()).toBe('/app')
    expect(appPath('plan')).toBe('/app/plan')
    expect(appPath('/courses')).toBe('/app/courses')
  })
})
