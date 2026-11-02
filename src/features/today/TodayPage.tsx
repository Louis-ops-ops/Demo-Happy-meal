import { Card } from '../../components/Card'
import { platform } from '../../platform'

/** Placeholder until step 7. */
export function TodayPage() {
  return (
    <section className="flex flex-col gap-05">
      <p className="text-overline-caps text-text-muted">Aujourd'hui</p>
      <h1 className="text-display">Bonjour !</h1>
      <Card className="max-w-[70ch]">
        <p className="text-body-lg">
          Le socle de Happy meal est en place. Ton plan, tes repas et ta jauge de calories arrivent
          bientôt ici.
        </p>
        <p className="mt-03 text-caption text-text-muted">Cible : {platform.target}</p>
      </Card>
    </section>
  )
}
