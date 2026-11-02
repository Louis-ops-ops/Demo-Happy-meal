import { platform } from '../../platform'

/** Placeholder until step 7: checks tokens, Lexend and routing on both targets. */
export function TodayPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-app flex-col gap-05 px-05 py-06 lg:px-06">
      <p className="text-overline-caps text-lightgreen-p">Aujourd'hui</p>
      <h1 className="text-display">Bonjour !</h1>
      <p className="max-w-[70ch] text-body-lg">
        Le socle de Happy meal est en place. Ton plan, tes repas et ta jauge de calories arrivent
        bientôt ici.
      </p>
      <p className="text-caption text-darkgreen-500">Cible : {platform.target}</p>
    </main>
  )
}
