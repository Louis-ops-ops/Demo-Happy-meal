import { useEffect, useState } from 'react'
import { loadReferenceData, type ReferenceData } from './reference'

export type ReferenceState =
  | { status: 'loading' }
  | { status: 'ready'; data: ReferenceData }
  | { status: 'error'; message: string }

/** Loads the reference foods and recipes once and shares them between screens. */
export function useReferenceData(): ReferenceState {
  const [state, setState] = useState<ReferenceState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    loadReferenceData()
      .then((data) => active && setState({ status: 'ready', data }))
      .catch((error: unknown) =>
        active && setState({ status: 'error', message: error instanceof Error ? error.message : String(error) }),
      )
    return () => {
      active = false
    }
  }, [])

  return state
}
