import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { Chip } from '../../../components/Chip'
import { clayForText } from '../../../components/clay'
import { SearchField } from '../../../components/SearchField'
import { useReferenceData } from '../../../data/useReferenceData'
import { exclusionKey, type Diet } from '../../../domain/diet'
import { useOnboarding } from '../../../store/onboarding'
import { DIET_LABELS } from '../labels'
import { OnboardingLayout } from '../OnboardingLayout'
import { onboardingPath } from '../paths'

const MAX_SUGGESTIONS = 6

/** Figma O3 Régime et allergies (33:3990): diet chips, then ingredients to exclude. */
export function DietStep() {
  const navigate = useNavigate()
  const { draft, update } = useOnboarding()
  const reference = useReferenceData()
  const [query, setQuery] = useState('')

  // Every ingredient used in the recipes, once, by its normalized key.
  const ingredients = useMemo(() => {
    if (reference.status !== 'ready') return []
    const byKey = new Map<string, string>()
    for (const recipe of reference.data.recipes.values()) {
      for (const { label } of recipe.ingredients) {
        const key = exclusionKey(label)
        if (!byKey.has(key)) byKey.set(key, label)
      }
    }
    return [...byKey.entries()].map(([key, label]) => ({ key, label }))
  }, [reference])

  const excludedKeys = new Set(draft.exclusions.map(exclusionKey))
  const queryKey = exclusionKey(query)
  const suggestions = queryKey
    ? ingredients
        .filter(({ key }) => !excludedKeys.has(key) && ` ${key}`.includes(` ${queryKey}`))
        .slice(0, MAX_SUGGESTIONS)
    : []

  const toggleDiet = (diet: Diet) =>
    update({ diets: draft.diets.includes(diet) ? draft.diets.filter((d) => d !== diet) : [...draft.diets, diet] })
  const addExclusion = (label: string) => {
    if (!exclusionKey(label) || excludedKeys.has(exclusionKey(label))) return
    const text = label.trim()
    update({ exclusions: [...draft.exclusions, text.charAt(0).toUpperCase() + text.slice(1)] })
    setQuery('')
  }
  const removeExclusion = (label: string) => update({ exclusions: draft.exclusions.filter((e) => e !== label) })
  const next = () => navigate(onboardingPath('foyer'))

  return (
    <OnboardingLayout
      step={3}
      onBack={() => navigate(onboardingPath('recap'))}
      onSkip={next}
      title="Tu suis un régime ?"
      intro="Les recettes qui ne te conviennent pas seront masquées."
      action={
        <Button fullWidth onClick={next}>
          Continuer
        </Button>
      }
    >
      <div className="flex flex-col gap-03">
        <div className="flex flex-wrap gap-02" role="group" aria-label="Régimes">
          {(Object.keys(DIET_LABELS) as Diet[]).map((diet) => (
            <Chip key={diet} label={DIET_LABELS[diet]} selected={draft.diets.includes(diet)} onClick={() => toggleDiet(diet)} />
          ))}
        </div>
        <p className="text-caption text-text-muted">
          Gluten et lactose sont repérés d’après le nom des aliments : en cas d’allergie, vérifie toujours les étiquettes.
        </p>
      </div>

      <section className="flex flex-col gap-03" aria-labelledby="exclusions-title">
        <h2 id="exclusions-title" className="text-title-3 text-text">
          Aliments à exclure
        </h2>
        <p className="text-body-sm text-text-muted">Allergies ou aliments que tu n’aimes pas.</p>
        <SearchField
          label="Ajouter un aliment à exclure"
          placeholder="Ajouter un aliment"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addExclusion(suggestions[0]?.label ?? query)
            }
          }}
        />

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-02" aria-label="Suggestions" role="group">
            {suggestions.map(({ key, label }) => (
              <Chip key={key} label={`+ ${label}`} clay={clayForText(key)} onClick={() => addExclusion(label)} />
            ))}
          </div>
        )}

        {draft.exclusions.length > 0 && (
          <ul className="flex flex-wrap gap-02" aria-label="Aliments exclus">
            {draft.exclusions.map((label) => (
              <li key={label}>
                <Chip
                  label={label}
                  selected
                  clay={clayForText(exclusionKey(label))}
                  aria-label={`Retirer ${label}`}
                  onClick={() => removeExclusion(label)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </OnboardingLayout>
  )
}
