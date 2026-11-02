import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ClayIcon } from '../../components/ClayIcon'
import { OptionCard } from '../../components/OptionCard'
import { clearAllData } from '../../data/backup'
import { appPath, platform } from '../../platform'
import { onboardingPath } from '../onboarding/paths'
import { loadDemo } from './demoData'

/** Demo entry for the web build ("Tester l'appli"): a full onboarding, or a ready-made profile. */
export function DemoPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  if (!platform.hasDemo) return <Navigate to={appPath()} replace />

  async function start(kind: 'full' | 'demo') {
    setBusy(true)
    setError(false)
    try {
      if (kind === 'demo') {
        await loadDemo()
        navigate(appPath(), { replace: true })
      } else {
        await clearAllData()
        navigate(onboardingPath('accueil'), { replace: true })
      }
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center gap-05 bg-bg px-05 py-06 text-text">
      <span className="mx-auto flex size-32 items-center justify-center rounded-full bg-surface shadow-raised">
        <ClayIcon id="cocotte" size={80} />
      </span>
      <div className="flex flex-col gap-02 text-center">
        <h1 className="text-title-1">Tester Happy meal</h1>
        <p className="text-body text-text-muted">Choisis comment découvrir l’appli. Tout reste sur ton appareil.</p>
      </div>
      <div className="flex flex-col gap-04" aria-busy={busy}>
        <OptionCard
          icon="user"
          title="Parcours complet"
          description="Réponds aux questions et découvre ton propre plan."
          onClick={busy ? undefined : () => start('full')}
        />
        <OptionCard
          icon="spark"
          title="Profil de démo"
          description="Un profil prêt à l’emploi : plan, courses et 10 jours d’historique."
          onClick={busy ? undefined : () => start('demo')}
        />
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-text">
          Impossible de préparer la démo. Recharge la page et réessaie.
        </p>
      )}
    </main>
  )
}
