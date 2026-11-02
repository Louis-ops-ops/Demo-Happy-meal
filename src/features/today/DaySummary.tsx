import { Card } from '../../components/Card'
import { Gauge } from '../../components/Gauge'
import { MacroStat } from '../../components/MacroStat'
import { ProgressBar } from '../../components/ProgressBar'
import { macroProgress } from '../../domain/journal'
import type { MacroTargets, Nutrients } from '../../domain/types'
import { formatInt } from '../format'

const MACRO_LABELS = { proteinG: 'Protéines', carbsG: 'Glucides', fatG: 'Lipides' } as const

export type DaySummaryProps = {
  eaten: Nutrients
  kcalTarget: number
  macros: MacroTargets
}

/** kcal and macros of the day against the targets: a compact bar on mobile, the ring gauge from 1024 px. */
export function DaySummary({ eaten, kcalTarget, macros }: DaySummaryProps) {
  const valueText = `${formatInt(eaten.kcal)} sur ${formatInt(kcalTarget)} kcal`

  return (
    <Card className="flex flex-col gap-04" aria-label="Bilan du jour">
      <div className="flex flex-col gap-03 lg:hidden">
        <p className="flex items-baseline gap-02">
          <span className="text-title-1 text-text">{formatInt(eaten.kcal)}</span>
          <span className="text-body-sm text-text-muted">sur {formatInt(kcalTarget)} kcal</span>
        </p>
        <ProgressBar value={eaten.kcal} max={kcalTarget} label="Calories du jour" valueText={valueText} />
      </div>
      <div className="hidden justify-center lg:flex">
        <Gauge value={eaten.kcal} target={kcalTarget} label="Calories du jour" unit="kcal" size={220} />
      </div>
      <div className="flex gap-02">
        {macroProgress(eaten, macros).map(({ key, eaten: value, target }) => (
          <MacroStat
            key={key}
            value={`${formatInt(value)} g`}
            label={MACRO_LABELS[key]}
            target={`sur ${formatInt(target)} g`}
          />
        ))}
      </div>
    </Card>
  )
}
