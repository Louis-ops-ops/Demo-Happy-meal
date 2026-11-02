import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { ClayIcon } from '../../../components/ClayIcon'
import { OptionCard } from '../../../components/OptionCard'
import { ProgressBar } from '../../../components/ProgressBar'
import { useOnboarding } from '../../../store/onboarding'
import { OnboardingLayout } from '../OnboardingLayout'
import { onboardingPath } from '../paths'

const SPLASH_MS = 1400

/** Figma O1 Splash (33:3915): cocotte in a raised disc, name, tagline, loading bar. */
export function SplashStep() {
  const navigate = useNavigate()
  const reset = useOnboarding((state) => state.reset)
  const next = () => navigate(onboardingPath('presentation'), { replace: true })

  useEffect(() => {
    reset() // a new onboarding starts from blank answers
    const timer = window.setTimeout(next, SPLASH_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <button
      type="button"
      onClick={next}
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-05 bg-bg px-05 text-center"
      aria-label="Happy meal, continuer"
    >
      <span className="flex size-32 items-center justify-center rounded-full bg-surface shadow-raised">
        <ClayIcon id="cocotte" size={80} />
      </span>
      <span className="flex flex-col gap-02">
        <span className="text-title-1 text-text">Happy meal</span>
        <span className="text-body text-text-muted">Ton plan repas, à ta mesure.</span>
      </span>
      <span className="w-[120px]">
        <ProgressBar value={2} max={5} label="Chargement" />
      </span>
    </button>
  )
}

/** Figma O2 Explication (33:3929), copy adapted to the v2 (plan, "ce que j'ai déjà", nutrition). */
export function IntroStep() {
  const navigate = useNavigate()

  return (
    <OnboardingLayout
      title="Mange mieux, sans prise de tête"
      intro="Happy meal estime tes besoins, te propose un plan de repas et prépare ta liste de courses."
      action={
        <Button fullWidth onClick={() => navigate(onboardingPath('metriques'))}>
          Commencer
        </Button>
      }
    >
      <div className="flex justify-center gap-04" aria-hidden>
        {(['tomate', 'steak', 'courgette'] as const).map((id) => (
          <span key={id} className="flex size-22 items-center justify-center rounded-03 bg-surface shadow-raised">
            <ClayIcon id={id} size={56} />
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-04">
        <OptionCard icon="calendar" title="Un plan sur mesure" description="7 ou 14 jours de recettes, calées sur tes besoins." />
        <OptionCard icon="refrigerator" title="Ce que tu as déjà" description="Les aliments de ton frigo passent en priorité." />
        <OptionCard icon="flame" title="La nutrition calculée" description="Kcal et macros d'après la table Ciqual de l'Anses." />
      </div>
      <p className="text-caption text-text-muted">Tes données restent sur ton appareil.</p>
    </OnboardingLayout>
  )
}
