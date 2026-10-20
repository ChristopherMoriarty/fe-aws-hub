import { Moon, Sun } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { login } from '../../api/session'
import { useTheme } from '../../hooks/useTheme'

export function LoginScreen() {
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t sign in')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid h-full lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
      <section className="hidden flex-col justify-between bg-[var(--color-rail)] px-12 py-10 text-[var(--color-rail-text)] lg:flex">
        <Wordmark light />
        <div className="max-w-md">
          <p className="text-[11px] font-medium tracking-[0.22em] text-[var(--color-rail-muted)] uppercase">
            Practice
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.08] font-medium tracking-tight">
            A quieter way to prepare for the exam.
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[var(--color-rail-muted)]">
          Short topic drills with instant feedback, and a timed practice exam.
        </p>
      </section>

      <section className="relative flex items-center justify-center px-6 py-16">
        <button
          type="button"
          aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-muted)]"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <form onSubmit={(event) => void handleSubmit(event)} className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Wordmark />
          </div>
          <h2 className="font-serif text-4xl font-medium tracking-tight">Sign in</h2>

          <label className="mt-8 block">
            <span className="mb-2 block text-[11px] font-medium tracking-[0.16em] text-[var(--color-muted)] uppercase">
              Email
            </span>
            <input
              autoFocus
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-[11px] font-medium tracking-[0.16em] text-[var(--color-muted)] uppercase">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          {error ? <p className="mt-4 text-sm text-[var(--color-bad)]">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-deep)] disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  )
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl font-serif text-lg ${
          light
            ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
            : 'bg-[var(--color-rail)] text-[var(--color-rail-text)]'
        }`}
      >
        A
      </span>
      <span className={`text-sm font-medium tracking-tight ${light ? '' : 'text-[var(--color-text)]'}`}>
        AWS Hub
      </span>
    </div>
  )
}
