import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { backupFileName, clearAllData, exportBackup, importBackup, parseBackup, type Backup } from '../../data/backup'
import type { Profile } from '../../data/db'
import { toIsoDate } from '../../domain/dates'
import { loadDemo } from '../demo/demoData'
import { onboardingPath } from '../onboarding/paths'

export type DataCardProps = { profile: Profile; showDemo: boolean }

/** Export / import of all data as one JSON file, demo reset (web demo only) and erase. */
export function DataCard({ profile, showDemo }: DataCardProps) {
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<Backup | null>(null)
  const [erasing, setErasing] = useState(false)

  async function download() {
    const backup = await exportBackup()
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName(toIsoDate(new Date()))
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Sauvegarde téléchargée. Garde-la au chaud : elle contient tout ton suivi.')
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    const parsed = parseBackup(await file.text())
    if (fileInput.current) fileInput.current.value = ''
    if (!parsed.ok) {
      setPending(null)
      setMessage(parsed.message)
      return
    }
    setMessage('')
    setPending(parsed.backup)
  }

  async function confirmImport() {
    if (!pending) return
    await importBackup(pending)
    setPending(null)
    setMessage('Sauvegarde importée : tes données ont été remplacées.')
  }

  async function erase() {
    await clearAllData()
    navigate(onboardingPath('accueil'), { replace: true })
  }

  return (
    <Card className="flex flex-col gap-04">
      <h2 className="text-title-3 text-text">Mes données</h2>
      <p className="text-body-sm text-text-muted">
        Tout est enregistré sur cet appareil. Exporte un fichier pour le sauvegarder ou le retrouver ailleurs.
      </p>
      <div className="flex flex-col gap-03 md:flex-row lg:flex-col xl:flex-row">
        <Button variant="secondary" icon="download" onClick={download}>
          Exporter mes données
        </Button>
        <Button variant="secondary" icon="upload" onClick={() => fileInput.current?.click()}>
          Importer une sauvegarde
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choisir un fichier de sauvegarde"
          onChange={(event) => onFile(event.target.files?.[0])}
        />
      </div>

      {pending && (
        <div role="alertdialog" aria-label="Confirmer l’import" className="flex flex-col gap-03 rounded-02 bg-surface p-04 shadow-pressed">
          <p className="text-body text-text">
            Remplacer tes données actuelles par cette sauvegarde ({pending.weighIns.length} pesées, {pending.journal.length} repas
            notés, {pending.plans.length} plan) ? Ce que tu as maintenant sera perdu.
          </p>
          <div className="flex gap-03">
            <Button onClick={confirmImport}>Remplacer</Button>
            <Button variant="secondary" onClick={() => setPending(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      <p role="status" className="text-body-sm text-focus-text empty:hidden">
        {message}
      </p>

      {showDemo && profile.demo && (
        <div className="flex flex-col gap-02">
          <Button
            variant="secondary"
            icon="refresh-cw"
            onClick={async () => {
              await loadDemo()
              setMessage('La démo est revenue à son état d’origine.')
            }}
          >
            Réinitialiser la démo
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-03 border-t border-darkgreen-200 pt-04">
        {erasing ? (
          <div role="alertdialog" aria-label="Confirmer l’effacement" className="flex flex-col gap-03">
            <p className="text-body text-text">Effacer définitivement toutes tes données de cet appareil ?</p>
            <div className="flex gap-03">
              <Button onClick={erase}>Oui, tout effacer</Button>
              <Button variant="secondary" onClick={() => setErasing(false)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" icon="trash" onClick={() => setErasing(true)}>
            Effacer toutes mes données
          </Button>
        )}
      </div>
    </Card>
  )
}
