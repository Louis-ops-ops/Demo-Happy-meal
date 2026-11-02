import { Link } from 'react-router-dom'
import { appPath } from '../platform'

/** Placeholder until step 9: the case study lives here on the web build. */
export function PortfolioPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-app flex-col justify-center gap-05 px-05 py-06 lg:px-06">
      <p className="text-overline-caps text-lightgreen-p">2026 · Projet perso</p>
      <h1 className="text-display">Happy meal</h1>
      <p className="max-w-[70ch] text-body-lg">
        Un plan alimentaire construit à partir de ton frigo et de ton déficit calorique.
      </p>
      <Link
        to={appPath()}
        className="inline-flex min-h-[var(--touch-target)] w-fit items-center rounded-full bg-primary px-05 text-label text-on-primary"
      >
        Tester l'appli
      </Link>
    </main>
  )
}
