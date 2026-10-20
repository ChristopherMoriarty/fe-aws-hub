import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Moon, Sun } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { clearSession } from '../../api/session'
import { useCertification } from '../../certification'
import { useTheme } from '../../hooks/useTheme'
import { useMe } from '../../hooks/useCatalog'

export function AppShell() {
  const { theme, setTheme } = useTheme()
  const { data: me } = useMe()
  const { certifications, selected, setCertificationId } = useCertification()
  const queryClient = useQueryClient()

  return (
    <div className="flex h-full">
      <aside className="flex w-72 shrink-0 flex-col border-r border-[var(--color-rail-line)] bg-[var(--color-rail)] px-5 py-6 text-[var(--color-rail-text)]">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] font-serif text-lg text-[var(--color-on-accent)]">
            A
          </span>
          <p className="text-sm font-medium tracking-tight">AWS Hub</p>
        </Link>

        {certifications.length > 0 ? (
          <label className="mt-8 block">
            <span className="px-1 text-[11px] font-medium tracking-[0.16em] text-[var(--color-rail-muted)] uppercase">
              Certification
            </span>
            <select
              value={selected?.id ?? ''}
              onChange={(event) => setCertificationId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--color-rail-line)] bg-white/5 px-3 py-2.5 text-sm text-[var(--color-rail-text)] outline-none"
            >
              {certifications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <nav className="mt-8 space-y-1">
          <SideLink to="/" end>
            Topics
          </SideLink>
          <SideLink to="/exam">Exam</SideLink>
        </nav>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--color-rail-muted)] hover:text-[var(--color-rail-text)]"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <div className="border-t border-[var(--color-rail-line)] pt-3">
            <p className="truncate px-3 text-xs text-[var(--color-rail-muted)]">{me?.email}</p>
            <button
              type="button"
              onClick={() => {
                clearSession()
                queryClient.clear()
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--color-rail-muted)] hover:text-[var(--color-rail-text)]"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function SideLink({
  to,
  end = false,
  children,
}: {
  to: string
  end?: boolean
  children: string
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block rounded-xl px-3 py-2 text-sm ${
          isActive
            ? 'bg-white/10 text-[var(--color-rail-text)]'
            : 'text-[var(--color-rail-muted)] hover:text-[var(--color-rail-text)]'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
