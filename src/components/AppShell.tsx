import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ClayIcon } from './ClayIcon'
import { cn } from './cn'
import { Icon, type IconName } from './Icon'

export type NavItem = {
  to: string
  label: string
  icon: IconName
  /** Match the path exactly (for the home tab). */
  end?: boolean
}

export type AppShellProps = {
  items: ReadonlyArray<NavItem>
  homePath: string
  /** Shown at the bottom of the desktop sidebar (daily kcal summary). */
  sidebarFooter?: ReactNode
  children: ReactNode
}

/**
 * App frame: Figma NavBar at the bottom below 1024 px, fixed left sidebar from 1024 px.
 * Both use the same items, icons and tokens.
 */
export function AppShell({ items, homePath, sidebarFooter, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-02 bg-primary px-04 py-02 text-label text-on-primary focus:not-sr-only focus:fixed focus:top-04 focus:left-04"
      >
        Aller au contenu
      </a>

      <Sidebar items={items} homePath={homePath} footer={sidebarFooter} />

      <div className="lg:pl-[calc(var(--sidebar-width)+var(--spacing-04))]">
        <main
          id="contenu"
          tabIndex={-1}
          className="mx-auto w-full max-w-app px-05 pt-06 pb-[calc(120px+env(safe-area-inset-bottom))] outline-none lg:px-06 lg:pb-06"
        >
          {children}
        </main>
      </div>

      <TabBar items={items} />
    </div>
  )
}

function TabBar({ items }: { items: ReadonlyArray<NavItem> }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 bg-surface px-03 pt-03 pb-[calc(var(--spacing-06)+env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="mx-auto flex max-w-[480px] gap-01 rounded-03 bg-surface p-02 shadow-raised">
        {items.map((item) => (
          // Width follows the label so "Aujourd'hui" fits at 360 px without truncation.
          <li key={item.to} className="min-w-0 flex-auto">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-01 rounded-02 px-02 py-02',
                  'transition-[box-shadow,color] duration-[var(--duration-fast)] ease-out',
                  isActive ? 'text-overline text-text shadow-pressed' : 'text-caption text-text-muted hover:text-text',
                )
              }
            >
              <Icon name={item.icon} size={24} />
              <span className="max-w-full truncate">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Sidebar({
  items,
  homePath,
  footer,
}: {
  items: ReadonlyArray<NavItem>
  homePath: string
  footer?: ReactNode
}) {
  return (
    <aside className="fixed top-04 bottom-04 left-04 z-40 hidden w-[var(--sidebar-width)] flex-col gap-06 rounded-03 bg-surface p-05 shadow-raised lg:flex">
      <NavLink to={homePath} className="flex items-center gap-03 rounded-02">
        <ClayIcon id="casserole" size={40} />
        <span className="text-title-3 text-text">Happy meal</span>
      </NavLink>

      <nav aria-label="Navigation principale">
        <ul className="flex flex-col gap-02">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex h-12 items-center gap-03 rounded-02 px-04 text-label',
                    'transition-[box-shadow,color] duration-[var(--duration-fast)] ease-out',
                    isActive ? 'text-text shadow-pressed' : 'text-text-muted hover:text-text hover:shadow-flat',
                  )
                }
              >
                <Icon name={item.icon} size={24} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {footer && <div className="mt-auto">{footer}</div>}
    </aside>
  )
}
