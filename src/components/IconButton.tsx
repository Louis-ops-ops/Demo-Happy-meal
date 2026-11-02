import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'
import { Icon, type IconName } from './Icon'

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  icon: IconName
  /** Required: the button has no visible text. */
  label: string
  /** Raised = back, filters, favorite. Primary = floating add button. */
  variant?: 'raised' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  /** Toggle state ("on"). Renders the Figma Pressed state and sets aria-pressed. */
  pressed?: boolean
  /** Icon color when pressed, e.g. the accent for a favorite. */
  pressedClassName?: string
}

const sizes = {
  sm: { box: 'size-10', shadow: 'shadow-raised-sm', icon: 20 },
  md: { box: 'size-12', shadow: 'shadow-raised', icon: 20 },
  lg: { box: 'size-[60px]', shadow: 'shadow-raised', icon: 24 },
} as const

/** Figma IconButton (20:2898). */
export function IconButton({
  icon,
  label,
  variant = 'raised',
  size = 'sm',
  pressed,
  pressedClassName,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const { box, shadow, icon: iconSize } = sizes[size]
  const isPrimary = variant === 'primary'

  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        // The ::before keeps a 44 px hit area around the 40 px small button.
        'relative inline-flex shrink-0 items-center justify-center rounded-full before:absolute before:-inset-0.5 before:rounded-full',
        'transition-[box-shadow,color] duration-[var(--duration-fast)] ease-out disabled:cursor-not-allowed',
        'disabled:bg-surface disabled:text-disabled disabled:shadow-flat',
        box,
        isPrimary
          ? 'bg-primary text-on-primary shadow-primary active:shadow-primary-pressed'
          : cn(
              'bg-surface active:shadow-pressed',
              pressed ? cn('shadow-pressed', pressedClassName ?? 'text-focus-text') : cn('text-text', shadow),
            ),
        pressed && isPrimary && 'shadow-primary-pressed',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  )
}
