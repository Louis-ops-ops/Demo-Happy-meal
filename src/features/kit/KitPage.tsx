import { useState, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { CheckRow } from '../../components/CheckRow'
import { ChoiceCards } from '../../components/ChoiceCard'
import { Chip } from '../../components/Chip'
import { clayIds, type ClayId } from '../../components/clay'
import { ClayIcon } from '../../components/ClayIcon'
import { Gauge } from '../../components/Gauge'
import { Icon, type IconName } from '../../components/Icon'
import { IconButton } from '../../components/IconButton'
import { KcalSummary } from '../../components/KcalSummary'
import { MacroStat } from '../../components/MacroStat'
import { OptionCard } from '../../components/OptionCard'
import { ProgressBar } from '../../components/ProgressBar'
import { QuantityStepper } from '../../components/QuantityStepper'
import { RecipeCard } from '../../components/RecipeCard'
import { SearchField } from '../../components/SearchField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { StepIndicator } from '../../components/StepIndicator'
import { Stepper } from '../../components/Stepper'
import { Switch } from '../../components/Switch'
import { TextField } from '../../components/TextField'
import { TopBar } from '../../components/TopBar'

const iconNames: IconName[] = [
  'back', 'battery', 'calendar', 'chart-spline', 'check', 'chevron-right', 'circle-alert',
  'circle-check', 'clock', 'cooking-pot', 'download', 'filter', 'flame', 'heart', 'heart-filled',
  'minus', 'plus', 'refrigerator', 'scan', 'search', 'shopping-basket', 'spark', 'sun', 'timer',
  'trash', 'upload', 'user', 'x',
]

const chipFoods: Array<{ id: ClayId; label: string }> = [
  { id: 'tomate', label: 'Tomates' },
  { id: 'courgette', label: 'Courgette' },
  { id: 'oeuf', label: 'Œufs' },
  { id: 'blanc-de-poulet', label: 'Blanc de poulet' },
]

const paces = [
  { value: 'doux', label: 'Doux' },
  { value: 'modere', label: 'Modéré' },
  { value: 'soutenu', label: 'Soutenu' },
] as const

/** Dev page listing every UI Kit component, to check them at mobile and desktop widths. */
export default function KitPage() {
  const [diets, setDiets] = useState<string[]>(['Végétarien'])
  const [foods, setFoods] = useState<ClayId[]>(['tomate'])
  const [pace, setPace] = useState<(typeof paces)[number]['value']>('modere')
  const [reminder, setReminder] = useState(true)
  const [portion, setPortion] = useState(1)
  const [favorite, setFavorite] = useState(true)
  const [checked, setChecked] = useState<Record<string, boolean>>({ tomates: true })
  const [step, setStep] = useState(2)
  const [eaten, setEaten] = useState(1240)
  const [people, setPeople] = useState(2)
  const [duration, setDuration] = useState<'7' | '14'>('7')

  const toggle = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

  return (
    <div className="flex flex-col gap-06">
      <header className="flex flex-col gap-02">
        <p className="text-overline-caps text-text-muted">Développement</p>
        <h1 className="text-title-1">UI Kit</h1>
        <p className="max-w-[70ch] text-body text-text-muted">
          Composants de la bibliothèque Figma, en version code. Redimensionne la fenêtre pour voir la
          tab bar (moins de 1024 px) et la sidebar (à partir de 1024 px).
        </p>
      </header>

      <Section title="Actions">
        <Row label="Button">
          <Button icon="spark">Générer une recette</Button>
          <Button variant="secondary" icon="plus">
            Ajouter
          </Button>
          <Button disabled icon="spark">
            Désactivé
          </Button>
        </Row>
        <Row label="IconButton · raised (sm, md, lg) · pressé · désactivé">
          <IconButton icon="back" label="Retour" />
          <IconButton icon="filter" label="Filtres" size="md" />
          <IconButton icon="plus" label="Ajouter" size="lg" />
          <IconButton
            icon={favorite ? 'heart-filled' : 'heart'}
            label="Favori"
            pressed={favorite}
            pressedClassName="text-accent"
            onClick={() => setFavorite(!favorite)}
          />
          <IconButton icon="plus" label="Ajouter (désactivé)" disabled />
        </Row>
        <Row label="IconButton · primary (sm, md, lg)">
          <IconButton icon="plus" label="Ajouter un repas" variant="primary" />
          <IconButton icon="plus" label="Ajouter un repas" variant="primary" size="md" />
          <IconButton icon="plus" label="Ajouter un repas" variant="primary" size="lg" />
        </Row>
      </Section>

      <Section title="Saisie et sélection">
        <div className="grid gap-05 md:grid-cols-2">
          <SearchField label="Rechercher un aliment" />
          <TextField label="Poids actuel" inputMode="decimal" defaultValue="78,5" suffix="kg" hint="Pesée du matin, à jeun." />
        </div>
        <Row label="Chip">
          {['Végétarien', 'Sans gluten', 'Sans lactose', 'Halal'].map((diet) => (
            <Chip
              key={diet}
              label={diet}
              selected={diets.includes(diet)}
              onClick={() => setDiets(toggle(diets, diet))}
            />
          ))}
        </Row>
        <Row label="IllustratedChip · « Ce que j'ai déjà »">
          {chipFoods.map((food) => (
            <Chip
              key={food.id}
              clay={food.id}
              label={food.label}
              selected={foods.includes(food.id)}
              onClick={() => setFoods(toggle(foods, food.id))}
            />
          ))}
        </Row>
        <div className="grid gap-05 md:grid-cols-2">
          <div className="flex flex-col gap-02">
            <Caption>SegmentedControl (← → au clavier)</Caption>
            <SegmentedControl label="Rythme" options={paces} value={pace} onChange={setPace} />
          </div>
          <div className="flex flex-col gap-02">
            <Caption>QuantityStepper</Caption>
            <QuantityStepper
              label="Portion"
              value={portion}
              onChange={setPortion}
              min={0.75}
              max={1.5}
              step={0.25}
              format={(v) => `${v.toLocaleString('fr-FR')} portion`}
            />
          </div>
        </div>
        <Row label="Stepper">
          <Stepper label="Personnes" value={people} onChange={setPeople} max={8} />
        </Row>
        <div className="max-w-[520px]">
          <ChoiceCards
            legend="ChoiceCards"
            choices={[
              { value: '7', title: 'Une semaine', description: 'Idéal pour commencer', icon: 'calendar' },
              { value: '14', title: 'Deux semaines', description: 'Moins de courses à prévoir', icon: 'calendar' },
            ]}
            value={duration}
            onChange={setDuration}
          />
        </div>
        <div className="max-w-[420px]">
          <Switch
            label="Rappel de pesée"
            description="Une notification douce le lundi matin."
            checked={reminder}
            onChange={setReminder}
          />
        </div>
      </Section>

      <Section title="Navigation">
        <Card relief="flat" className="overflow-hidden p-0">
          <TopBar title="Fiche recette" onLeading={() => undefined} trailing={<IconButton icon="heart" label="Favori" />} />
        </Card>
        <Row label="StepIndicator">
          <StepIndicator current={step} total={4} />
          <Button variant="secondary" onClick={() => setStep(step === 4 ? 1 : step + 1)}>
            Étape suivante
          </Button>
        </Row>
        <p className="text-body-sm text-text-muted">
          AppShell : la tab bar et la sidebar entourent cette page.
        </p>
      </Section>

      <Section title="Listes et cartes">
        <div className="grid gap-05 lg:grid-cols-2">
          <RecipeCard
            title="Curry de lentilles corail"
            meta="25 min · 420 kcal"
            favorite={favorite}
            onToggleFavorite={() => setFavorite(!favorite)}
            onOpen={() => undefined}
          />
          <RecipeCard title="Poulet tomate et ail" meta="40 min · 460 kcal" clay="blanc-de-poulet" onToggleFavorite={() => undefined} />
          <OptionCard icon="search" title="Rechercher un aliment" description="Saisie hors plan, en moins de 10 s" onClick={() => undefined} />
          <OptionCard icon="flame" title="1 850 kcal par jour" description="Estimation indicative" />
        </div>
        <Card className="flex flex-col">
          {[
            { id: 'tomates', label: 'Tomates', clay: 'tomate' as const, detail: '600 g' },
            { id: 'oeufs', label: 'Œufs', clay: 'oeuf' as const, detail: '6' },
            { id: 'huile', label: "Huile d'olive", clay: 'huile-d-olive' as const, detail: '3 c. à s.' },
          ].map((item) => (
            <CheckRow
              key={item.id}
              label={item.label}
              detail={item.detail}
              visual={<ClayIcon id={item.clay} size={40} />}
              checked={!!checked[item.id]}
              onChange={(value) => setChecked({ ...checked, [item.id]: value })}
            />
          ))}
        </Card>
      </Section>

      <Section title="Données et statuts">
        {/* Desktop dashboard preview: 12-column grid, gutter spacing-05. */}
        <div className="grid grid-cols-1 gap-05 lg:grid-cols-12">
          <Card className="flex flex-col gap-04 lg:col-span-7">
            <p className="flex items-end gap-02">
              <span className="text-display">{eaten.toLocaleString('fr-FR')}</span>
              <span className="text-body text-text-muted">sur 2 000 kcal</span>
            </p>
            <ProgressBar value={eaten} max={2000} label="Calories du jour" />
            <div className="flex gap-03">
              <MacroStat value="62 g" label="Protéines" />
              <MacroStat value="148 g" label="Glucides" />
              <MacroStat value="47 g" label="Lipides" />
            </div>
            <Row label="Simuler un repas">
              <Button variant="secondary" icon="plus" onClick={() => setEaten(eaten + 350)}>
                350 kcal
              </Button>
              <Button variant="secondary" onClick={() => setEaten(0)}>
                Remettre à zéro
              </Button>
            </Row>
          </Card>
          <Card className="flex flex-col items-center justify-center gap-04 lg:col-span-5">
            <Gauge value={eaten} target={2000} label="Calories du jour" unit="kcal" />
          </Card>
        </div>
        <div className="max-w-[var(--sidebar-width)]">
          <Caption>KcalSummary (bas de la sidebar)</Caption>
          <KcalSummary value={eaten} target={2000} />
        </div>
      </Section>

      <Section title="Icônes">
        <ul className="grid grid-cols-3 gap-04 md:grid-cols-6 lg:grid-cols-7">
          {iconNames.map((name) => (
            <li key={name} className="flex flex-col items-center gap-02 text-center">
              <Icon name={name} size={24} />
              <span className="text-caption text-text-muted">{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Illustrations clay">
        <ul className="grid grid-cols-3 gap-04 md:grid-cols-6">
          {clayIds.map((id) => (
            <li key={id} className="flex flex-col items-center gap-02 text-center">
              <ClayIcon id={id} size={48} />
              <span className="text-caption text-text-muted">{id}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-05">
      <h2 className="text-title-2">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-03">
      <Caption>{label}</Caption>
      <div className="flex flex-wrap items-center gap-04">{children}</div>
    </div>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="text-caption text-text-muted">{children}</p>
}
