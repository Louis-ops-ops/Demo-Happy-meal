import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'
import { Icon, type IconName } from './Icon'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Primary = the main action (one per screen). Secondary = next to a Primary, or alone for minor actions. */
  variant?: 'primary' | 'secondary'
  /** Only when the icon clarifies the action (Figma: Show icon). */
  icon?: IconName
  fullWidth?: boolean
  children: ReactNode
}

const variants = {
  primary:
    'bg-primary text-on-primary shadow-primary active:shadow-primary-pressed disabled:bg-surface disabled:text-disabled disabled:shadow-flat',
  secondary:
    'bg-surface text-text shadow-raised active:text-focus-text active:shadow-pressed disabled:text-disabled disabled:shadow-flat',
}

/** Figma Button (20:2843): H 52, padding spacing-05, gap spacing-02, radius-md, Texte/label. */
export function Button({
  variant = 'primary',
  icon,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-[52px] items-center justify-center gap-02 rounded-02 px-05 text-label whitespace-nowrap',
        'transition-[box-shadow,color] duration-[var(--duration-fast)] ease-out disabled:cursor-not-allowed',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  )
}
