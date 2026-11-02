import { useState } from 'react'
import { daysBetween } from '../../domain/dates'
import type { SmoothedWeighIn } from '../../domain/weight'
import { formatDecimal } from '../format'
import { formatShortDate } from './labels'
import { useContainerWidth } from './useContainerWidth'

export type WeightChartProps = {
  entries: ReadonlyArray<SmoothedWeighIn>
  /** Goal weight, drawn as a dashed line. */
  targetKg: number | null
}

const H = 240
const M = { left: 40, right: 12, top: 14, bottom: 28 }

/** Weigh-ins (dots) and their 7-day average (line). Scales with its container; every point is focusable for its value. */
export function WeightChart({ entries, targetKg }: WeightChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const [box, W] = useContainerWidth()
  if (entries.length === 0) return null

  const first = entries[0]!.date
  const span = Math.max(1, daysBetween(first, entries.at(-1)!.date))
  const values = entries.flatMap((e) => [e.kg, e.avg7]).concat(targetKg === null ? [] : [targetKg])
  const min = Math.floor(Math.min(...values) - 0.5)
  const max = Math.ceil(Math.max(...values) + 0.5)
  const x = (date: string) =>
    entries.length === 1 ? (M.left + W - M.right) / 2 : M.left + (daysBetween(first, date) / span) * (W - M.left - M.right)
  const y = (kg: number) => M.top + ((max - kg) / (max - min)) * (H - M.top - M.bottom)
  const ticks = Array.from({ length: 4 }, (_, i) => min + ((max - min) * i) / 3)
  const line = entries.map((e) => `${x(e.date)},${y(e.avg7)}`).join(' ')
  const point = active === null ? null : entries[active]!

  return (
    <div className="relative" ref={box}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="group"
        aria-label={`Courbe de poids : ${entries.length} pesées, dernière moyenne ${formatDecimal(Math.round(entries.at(-1)!.avg7 * 10) / 10)} kg`}
        className="block max-w-full"
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={M.left} x2={W - M.right} y1={y(tick)} y2={y(tick)} stroke="currentColor" className="text-darkgreen-200" />
            <text x={M.left - 8} y={y(tick) + 4} textAnchor="end" className="fill-text-muted text-[12px]">
              {formatDecimal(Math.round(tick * 10) / 10)}
            </text>
          </g>
        ))}
        {targetKg !== null && (
          <line x1={M.left} x2={W - M.right} y1={y(targetKg)} y2={y(targetKg)} stroke="currentColor" strokeDasharray="6 6" className="text-orange-p" />
        )}
        {entries.length > 1 && (
          <polyline points={line} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-focus" />
        )}
        {entries.map((e, i) => (
          <g key={e.date}>
            <circle cx={x(e.date)} cy={y(e.kg)} r="3.5" className="fill-darkgreen-400" />
            <circle
              cx={x(e.date)}
              cy={y(e.avg7)}
              r="14"
              fill="transparent"
              tabIndex={0}
              role="img"
              aria-label={`${formatShortDate(e.date)} : ${formatDecimal(e.kg)} kg, moyenne ${formatDecimal(Math.round(e.avg7 * 10) / 10)} kg`}
              className="cursor-pointer outline-none focus-visible:stroke-focus focus-visible:stroke-2"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          </g>
        ))}
        <text x={M.left} y={H - 8} className="fill-text-muted text-[12px]">{formatShortDate(first)}</text>
        {entries.length > 1 && (
          <text x={W - M.right} y={H - 8} textAnchor="end" className="fill-text-muted text-[12px]">
            {formatShortDate(entries.at(-1)!.date)}
          </text>
        )}
      </svg>
      {point && (
        <p
          role="status"
          className="pointer-events-none absolute top-0 right-0 rounded-02 bg-surface px-03 py-02 text-caption text-text shadow-raised-sm"
        >
          {formatShortDate(point.date)} · {formatDecimal(point.kg)} kg · moyenne {formatDecimal(Math.round(point.avg7 * 10) / 10)} kg
        </p>
      )}
      <ul className="mt-02 flex flex-wrap gap-x-04 gap-y-01 text-caption text-text-muted">
        <li className="flex items-center gap-01"><span className="size-2 rounded-full bg-darkgreen-400" />Pesées</li>
        <li className="flex items-center gap-01"><span className="h-0.5 w-4 rounded-full bg-focus" />Moyenne sur 7 jours</li>
        {targetKg !== null && <li className="flex items-center gap-01"><span className="h-0.5 w-4 rounded-full bg-orange-p" />Objectif</li>}
      </ul>
    </div>
  )
}
