import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckRow } from '../../components/CheckRow'
import { cn } from '../../components/cn'
import { ClayIcon } from '../../components/ClayIcon'
import { Icon } from '../../components/Icon'
import { ProgressBar } from '../../components/ProgressBar'
import { setShoppingState } from '../../data/db'
import { formatShoppingQuantity, type ShoppingLine } from '../../domain/shopping'
import { appPath } from '../../platform'
import { AISLE_LABELS } from './labels'
import { useShopping, type ShoppingItemState } from './useShopping'

const NONE: ShoppingItemState = { checked: false, atHome: false }

/** Courses tab: the ingredients of the whole plan by aisle, tickable, with "déjà à la maison" on each line. */
export function CoursesPage() {
  const navigate = useNavigate()
  const shopping = useShopping()

  if (shopping.status === 'loading') return <p className="text-body text-text-muted">Chargement de ta liste…</p>

  if (shopping.status === 'error') {
    return (
      <Card className="max-w-[70ch]" role="alert">
        <p className="text-body-lg text-text">Impossible de charger les recettes.</p>
        <p className="mt-02 text-body-sm text-text-muted">{shopping.message}</p>
      </Card>
    )
  }

  if (shopping.status === 'none') {
    return (
      <section className="mx-auto flex max-w-[520px] flex-col items-center gap-05 pt-05 text-center">
        <span className="flex size-32 items-center justify-center rounded-full bg-surface shadow-raised">
          <ClayIcon id="casserole" size={80} />
        </span>
        <div className="flex flex-col gap-02">
          <h1 className="text-title-1 text-text">Ta liste de courses</h1>
          <p className="text-body text-text-muted">
            {shopping.hasDraft
              ? 'Valide ton plan pour voir apparaître tous les ingrédients à acheter.'
              : 'Crée un plan : la liste de courses se prépare toute seule.'}
          </p>
        </div>
        <Button icon="spark" onClick={() => navigate(appPath(shopping.hasDraft ? 'plan' : 'plan/nouveau'))}>
          {shopping.hasDraft ? 'Voir mon plan' : 'Créer mon plan'}
        </Button>
      </section>
    )
  }

  const { plan, groups, state, progress } = shopping
  const toBuy = progress.total - progress.done

  return (
    <section className="flex flex-col gap-05">
      <header className="flex flex-col gap-03">
        <div className="flex flex-col gap-01">
          <p className="text-overline-caps text-text-muted">{plan.days} jours de repas</p>
          <h1 className="text-display text-text">Courses</h1>
        </div>
        <Card className="flex max-w-[640px] flex-col gap-03">
          <p className="flex items-baseline gap-02">
            <span className="text-title-1 text-text">{progress.done}</span>
            <span className="text-body-sm text-text-muted">
              sur {progress.total} articles · {toBuy === 0 ? 'tout est prêt' : `${toBuy} à acheter`}
            </span>
          </p>
          <ProgressBar
            value={progress.done}
            max={progress.total}
            label="Avancement des courses"
            valueText={`${progress.done} articles sur ${progress.total}`}
          />
        </Card>
      </header>

      <div className="gap-05 md:columns-2 xl:columns-3 [&>*]:mb-05">
        {groups.map(({ aisle, lines }) => (
          <Card key={aisle} className="break-inside-avoid" aria-labelledby={`aisle-${aisle}`} role="group">
            <h2 id={`aisle-${aisle}`} className="text-title-3 text-text">
              {AISLE_LABELS[aisle] ?? aisle}
            </h2>
            <ul className="mt-02 flex flex-col divide-y divide-darkgreen-200 [&>li]:py-01">
              {lines.map((line) => (
                <Line key={line.foodId} line={line} planId={plan.id} item={state.get(line.foodId) ?? NONE} />
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Line({ line, planId, item }: { line: ShoppingLine; planId: string; item: ShoppingItemState }) {
  const label = line.label.charAt(0).toUpperCase() + line.label.slice(1)
  return (
    <li className="flex items-center gap-02">
      <CheckRow
        className="min-w-0 flex-1"
        label={label}
        detail={item.atHome ? 'À la maison' : formatShoppingQuantity(line.grams)}
        checked={item.checked || item.atHome}
        onChange={(checked) => setShoppingState(planId, line.foodId, { checked, atHome: checked ? item.atHome : false })}
      />
      <button
        type="button"
        aria-pressed={item.atHome}
        aria-label={`${label} : déjà à la maison`}
        title="Déjà à la maison"
        onClick={() => setShoppingState(planId, line.foodId, { atHome: !item.atHome, checked: false })}
        className={cn(
          'relative flex size-10 shrink-0 items-center justify-center rounded-full before:absolute before:-inset-0.5 before:rounded-full',
          'transition-[box-shadow,color] duration-[var(--duration-fast)] ease-out',
          item.atHome ? 'text-focus-text shadow-pressed' : 'text-text-muted hover:text-text hover:shadow-raised-sm',
        )}
      >
        <Icon name="refrigerator" size={20} />
      </button>
    </li>
  )
}
