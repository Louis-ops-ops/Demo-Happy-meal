import { useState } from 'react'
import type { DayKcal } from '../../domain/tracking'
import { formatInt } from '../format'
import { formatShortDate } from './labels'
import { useContainerWidth } from './useContainerWidth'

export type KcalChartProps = { days: ReadonlyArray<DayKcal>; target: number }

const H = 200
const M = { left: 8, right: 8, top: 14, bottom: 26 }

/** kcal per day against the target (dashed). Over the target the bar keeps its color: no red. A day without a log is a thin stub. */
export function KcalChart({ days, target }: KcalChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const [box, W] = useContainerWidth()
  const max = Math.max(target * 1.25, ...days.map((d) => d.kcal))
  const slot = (W - M.left - M.right) / days.length
  const barW = Math.min(36, slot * 0.64)
  const y = (kcal: number) => M.top + (1 - kcal / max) * (H - M.top - M.bottom)
  const point = active === null ? null : days[active]!

  return (
    <div className="relative" ref={box}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="group"
        aria-label={`Calories des ${days.length} derniers jours, cible ${formatInt(target)} kcal`}
        className="block max-w-full"
        onMouseLeave={() => setActive(null)}
      >
        {days.map((day, i) => {
          const cx = M.left + slot * i + slot / 2
          const top = day.kcal > 0 ? y(day.kcal) : H - M.bottom - 3
          return (
            <g key={day.date}>
              <rect
                x={cx - barW / 2}
                y={top}
                width={barW}
                height={H - M.bottom - top}
                rx="4"
                className={day.kcal > 0 ? 'fill-focus' : 'fill-darkgreen-200'}
              />
              <rect
                x={cx - slot / 2}
                y={M.top}
                width={slot}
                height={H - M.top - M.bottom}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${formatShortDate(day.date)} : ${day.kcal > 0 ? `${formatInt(day.kcal)} kcal` : 'rien noté'}`}
                className="outline-none focus-visible:stroke-focus focus-visible:stroke-2"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          )
        })}
        <line x1={M.left} x2={W - M.right} y1={y(target)} y2={y(target)} stroke="currentColor" strokeDasharray="6 6" className="text-orange-p" />
        <text x={M.left} y={H - 8} className="fill-text-muted text-[12px]">{formatShortDate(days[0]!.date)}</text>
        <text x={W - M.right} y={H - 8} textAnchor="end" className="fill-text-muted text-[12px]">
          {formatShortDate(days.at(-1)!.date)}
        </text>
      </svg>
      {point && (
        <p role="status" className="pointer-events-none absolute top-0 right-0 rounded-02 bg-surface px-03 py-02 text-caption text-text shadow-raised-sm">
          {formatShortDate(point.date)} · {point.kcal > 0 ? `${formatInt(point.kcal)} kcal` : 'rien noté'}
        </p>
      )}
    </div>
  )
}
