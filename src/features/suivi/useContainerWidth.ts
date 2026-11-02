import { useEffect, useRef, useState } from 'react'

/** Width in px of an element, kept up to date. Charts draw at this width so their text stays readable on phones. */
export function useContainerWidth(fallback = 600) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    setWidth(Math.round(node.clientWidth) || fallback)
    const observer = new ResizeObserver(([entry]) => entry && setWidth(Math.round(entry.contentRect.width) || fallback))
    observer.observe(node)
    return () => observer.disconnect()
  }, [fallback])

  return [ref, width] as const
}
