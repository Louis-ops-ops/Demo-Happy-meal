import { create } from 'zustand'
import { EMPTY_DRAFT, type OnboardingDraft } from '../features/onboarding/draft'

type OnboardingState = {
  draft: OnboardingDraft
  update: (patch: Partial<OnboardingDraft>) => void
  reset: () => void
}

/** In-memory onboarding answers; saved to IndexedDB only at the end. */
export const useOnboarding = create<OnboardingState>((set) => ({
  draft: EMPTY_DRAFT,
  update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
  reset: () => set({ draft: EMPTY_DRAFT }),
}))
