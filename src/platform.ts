import { BrowserRouter, HashRouter } from 'react-router-dom'

/**
 * Single place where the web and desktop builds differ.
 * Never branch on VITE_TARGET elsewhere: import from here.
 */
export type Target = 'web' | 'desktop'

export const target: Target = import.meta.env.VITE_TARGET === 'desktop' ? 'desktop' : 'web'

const isDesktop = target === 'desktop'

export const platform = {
  target,
  isDesktop,
  /** Desktop loads over file://, so it needs hash-based routing. */
  Router: isDesktop ? HashRouter : BrowserRouter,
  /** Where the app lives: `/app` on the web (portfolio owns `/`), `/` on desktop. */
  appBase: isDesktop ? '/' : '/app',
  hasPortfolio: !isDesktop,
  hasDemo: !isDesktop,
  hasServiceWorker: !isDesktop,
} as const

/** Builds an absolute path inside the app, e.g. appPath('plan') -> '/app/plan' on the web. */
export function appPath(subPath = ''): string {
  const base = platform.appBase.replace(/\/$/, '')
  const sub = subPath.replace(/^\//, '')
  return sub ? `${base}/${sub}` : base || '/'
}
