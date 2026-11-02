import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { clayForText } from '../../components/clay'
import { SearchField } from '../../components/SearchField'
import { TopBar } from '../../components/TopBar'
import { db, saveDraftPlan } from '../../data/db'
import { useReferenceData } from '../../data/useReferenceData'
import { toIsoDate } from '../../domain/dates'
import { exclusionKey } from '../../domain/diet'
import { generatePlan } from '../../domain/plan'
import { appPath } from '../../platform'
import { formatInt } from '../format'
import { availableSuggestions, ingredientLabels, toPlanRecipes } from './planRecipes'

type Have = { key: string; label: string; keyword: string }

const MAX_SUGGESTIONS = 6

/** Figma 02 "Cuisiner avec…" (32:3313), reused as the "Ce que j'ai déjà" step before a plan is generated. */
export function PlanSetupPage() {
  const navigate = useNavigate()
  const profile = useLiveQuery(async () => (await db.profile.get('me')) ?? null)
  const reference = useReferenceData()
  const [selected, setSelected] = useState<Have[]>([])
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const data = reference.status === 'ready' ? reference.data : null
  const recipes = useMemo(
    () => (data && profile ? toPlanRecipes(data, profile.diets, profile.exclusions) : []),
    [data, profile],
  )
  const suggestions = useMemo(
    () => availableSuggestions(recipes).map(({ label, keyword }) => ({ key: exclusionKey(keyword), label, keyword })),
    [recipes],
  )
  const ingredients = useMemo(() => (data ? ingredientLabels(data, recipes) : []), [data, recipes])

  const selectedKeys = new Set(selected.map((h) => h.key))
  const queryKey = exclusionKey(query)
  const matches = queryKey
    ? ingredients
        .filter(({ key }) => !selectedKeys.has(key) && ` ${key}`.includes(` ${queryKey}`))
        .slice(0, MAX_SUGGESTIONS)
    : []
  // Chips: the everyday foods, then whatever the search added.
  const custom = selected.filter((h) => !suggestions.some((s) => s.key === h.key))

  const toggle = (item: Have) =>
    setSelected((current) =>
      current.some((h) => h.key === item.key) ? current.filter((h) => h.key !== item.key) : [...current, item],
    )
  const addFromSearch = (label: string) => {
    const key = exclusionKey(label)
    if (!key || selectedKeys.has(key)) return
    const text = label.trim()
    setSelected((current) => [...current, { key, label: text.charAt(0).toUpperCase() + text.slice(1), keyword: text }])
    setQuery('')
  }

  const ready = !!data && !!profile

  async function generate() {
    if (!data || !profile) return
    setBusy(true)
    setError(null)
    const have = selected.map((h) => h.keyword)
    const input = {
      recipes,
      kcalTarget: profile.kcalTarget,
      mealsPerDay: profile.mealsPerDay,
      days: profile.planDays,
      have,
    }
    const meals = generatePlan(input)
    if (meals.length === 0) {
      setError('Aucune recette ne correspond à tes régimes et exclusions. Tu peux les assouplir dans ton profil.')
      setBusy(false)
      return
    }
    try {
      const today = toIsoDate(new Date())
      await saveDraftPlan(
        {
          id: crypto.randomUUID(),
          startDate: today,
          days: profile.planDays,
          mealsPerDay: profile.mealsPerDay,
          kcalTarget: profile.kcalTarget,
          have,
          status: 'draft',
          createdAt: today,
        },
        meals,
      )
      navigate(appPath('plan'), { replace: true })
    } catch {
      setError('Impossible d’enregistrer ton plan. Réessaie dans un instant.')
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-[720px] flex-col gap-05">
      <TopBar title="Ce que j’ai déjà" onLeading={() => navigate(appPath('plan'))} className="-mx-05 -mt-04 lg:mx-0 lg:mt-0 lg:px-0" />

      <div className="flex flex-col gap-02">
        <h2 className="text-title-1 text-text">Qu’as-tu déjà chez toi ?</h2>
        <p className="text-body text-text-muted">
          Coche ce que tu as sous la main : ton plan en tiendra compte en priorité. Cette sélection n’est pas enregistrée, tu peux aussi passer cette étape.
        </p>
      </div>

      {reference.status === 'error' && (
        <p role="alert" className="text-body text-text">
          Impossible de charger les recettes. {reference.message}
        </p>
      )}

      <SearchField
        label="Chercher un aliment"
        placeholder="Chercher un aliment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (matches[0]) addFromSearch(matches[0].label)
          }
        }}
      />
      {matches.length > 0 && (
        <div className="flex flex-wrap gap-02" role="group" aria-label="Suggestions">
          {matches.map(({ key, label }) => (
            <Chip key={key} label={`+ ${label}`} clay={clayForText(key)} onClick={() => addFromSearch(label)} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-02" role="group" aria-label="Aliments que j’ai déjà">
        {[...suggestions, ...custom].map((item) => (
          <Chip
            key={item.key}
            label={item.label}
            clay={clayForText(item.key)}
            selected={selectedKeys.has(item.key)}
            onClick={() => toggle(item)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-03 pt-03">
        {error && (
          <p role="alert" className="text-body-sm text-text">
            {error}
          </p>
        )}
        <p className="text-caption text-text-muted">
          {profile
            ? `${profile.planDays} jours · ${profile.mealsPerDay} repas par jour · ${formatInt(profile.kcalTarget)} kcal par jour`
            : ' '}
        </p>
        <Button fullWidth icon="spark" disabled={!ready || busy} onClick={generate}>
          {selected.length > 0 ? `Générer mon plan (${selected.length})` : 'Générer mon plan'}
        </Button>
      </div>
    </section>
  )
}
