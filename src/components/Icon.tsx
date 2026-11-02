import type { CSSProperties } from 'react'
import { cn } from './cn'

// Figma "Icon/*" set (Lucide strokes) + sun, shopping-basket, chart-spline from Lucide (ISC) for the v2 tabs.
const files = import.meta.glob<string>('../assets/icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const urls: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace(/^.*\/(.+)\.svg$/, '$1'), url]),
)

export type IconName =
  | 'back'
  | 'battery'
  | 'calendar'
  | 'chart-spline'
  | 'check'
  | 'chevron-right'
  | 'circle-alert'
  | 'circle-check'
  | 'clock'
  | 'cooking-pot'
  | 'download'
  | 'filter'
  | 'flame'
  | 'heart'
  | 'heart-filled'
  | 'minus'
  | 'plus'
  | 'refrigerator'
  | 'scan'
  | 'search'
  | 'shopping-basket'
  | 'spark'
  | 'sun'
  | 'timer'
  | 'trash'
  | 'upload'
  | 'user'
  | 'x'

export type IconProps = {
  name: IconName
  /** Figma: 20 px for kit icons, 24 px for screen icons. Never mix both in one bar. */
  size?: 16 | 20 | 24
  /** Accessible name. Omit for decorative icons (next to a visible label). */
  label?: string
  className?: string
}

/** Stroke icon tinted with the current text color. */
export function Icon({ name, size = 20, label, className }: IconProps) {
  const style = { '--icon': `url("${urls[name]}")`, width: size, height: size } as CSSProperties

  return (
    <span
      className={cn('icon-mask', className)}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
