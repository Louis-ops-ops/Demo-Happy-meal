import { Card } from '../components/Card'

/** Temporary screen for tabs that are built in later steps. */
export function PlaceholderPage({ title, step }: { title: string; step: number }) {
  return (
    <section className="flex flex-col gap-05">
      <h1 className="text-title-1">{title}</h1>
      <Card className="max-w-[70ch]">
        <p className="text-body-lg text-text-muted">Cet écran arrive à l'étape {step}.</p>
      </Card>
    </section>
  )
}
