import type { ClayId } from './clay'
import { cn } from './cn'

export type ClayIconProps = {
  id: ClayId
  /** Display size in px. Figma base size is 48, chips use 24, rows 40. */
  size?: number
  /** Accessible name. Omit when a visible label already names the food. */
  alt?: string
  className?: string
}

export function ClayIcon({ id, size = 48, alt = '', className }: ClayIconProps) {
  const src = (density: string) => `${import.meta.env.BASE_URL}clay/${density}/${id}.webp`

  return (
    <img
      src={src('1x')}
      srcSet={`${src('1x')} 1x, ${src('2x')} 2x, ${src('3x')} 3x`}
      width={size}
      height={size}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
