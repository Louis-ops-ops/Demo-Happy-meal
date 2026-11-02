import { ProgressBar } from './ProgressBar'

export type KcalSummaryProps = {
  value: number
  target: number
}

const formatter = new Intl.NumberFormat('fr-FR')

/** Daily kcal summary for the bottom of the desktop sidebar (same pattern as Figma "Bilan du jour"). */
export function KcalSummary({ value, target }: KcalSummaryProps) {
  const valueText = `${formatter.format(value)} sur ${formatter.format(target)} kcal`

  return (
    <div className="flex flex-col gap-03 rounded-02 bg-surface p-04 shadow-pressed">
      <p className="text-overline-caps text-text-muted">Aujourd'hui</p>
      <p className="flex items-baseline gap-02">
        <span className="text-title-2 text-text">{formatter.format(value)}</span>
        <span className="text-body-sm text-text-muted">sur {formatter.format(target)} kcal</span>
      </p>
      <ProgressBar value={value} max={target} label="Calories du jour" valueText={valueText} />
    </div>
  )
}
