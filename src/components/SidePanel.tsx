import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { IconButton } from './IconButton'

export type SidePanelProps = {
  /** Small caps line above the title. */
  eyebrow?: string
  title: string
  onClose: () => void
  /** CSS selector of the element to focus first (inside the panel). Defaults to the title. */
  initialFocus?: string
  children: ReactNode
}

/**
 * Modal panel: full screen on mobile, right side panel from 1024 px (no bottom sheet on desktop).
 * Moves focus to the title, keeps Tab inside, closes with Escape and gives focus back to the opener.
 */
export function SidePanel({ eyebrow, title, onClose, initialFocus, children }: SidePanelProps) {
  const panel = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const opener = useRef<Element | null>(null)

  useEffect(() => {
    opener.current = document.activeElement
    const target = initialFocus ? panel.current?.querySelector<HTMLElement>(initialFocus) : null
    ;(target ?? heading.current)?.focus()
    return () => {
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !panel.current) return
    const focusable = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 hidden bg-darkgreen-p/30 lg:block" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-panel-title"
        onKeyDown={onKeyDown}
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg lg:left-auto lg:w-[420px] lg:shadow-raised"
      >
        <header className="flex items-start gap-03 px-05 pt-04 pb-03">
          <div className="flex min-w-0 flex-1 flex-col gap-01 pt-01">
            {eyebrow && <p className="text-overline-caps text-text-muted">{eyebrow}</p>}
            <h2 id="side-panel-title" ref={heading} tabIndex={-1} className="text-title-2 text-text outline-none">
              {title}
            </h2>
          </div>
          <IconButton icon="x" label="Fermer" onClick={onClose} />
        </header>
        <div className="flex flex-col gap-05 px-05 pb-06">{children}</div>
      </div>
    </>
  )
}
