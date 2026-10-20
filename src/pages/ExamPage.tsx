import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { startAttempt } from '../api/attempts'
import { ApiError } from '../api/client'
import { useCertification } from '../certification'
import { useAttempts } from '../hooks/useCatalog'
import { formatClock, formatMinutes, formatWhen } from '../lib/format'
import type { Attempt } from '../types/attempt'

export function ExamPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selected, isLoading, isError } = useCertification()
  const attempts = useAttempts(selected?.id)

  const start = useMutation({
    mutationFn: () => startAttempt(selected!.id, { mode: 'exam' }),
    onSuccess: (attempt) => {
      void queryClient.invalidateQueries({ queryKey: ['attempts', selected?.id] })
      navigate(`/attempts/${attempt.id}`)
    },
  })

  if (isLoading) return <p className="text-sm text-[var(--color-muted)]">Loading…</p>
  if (isError) {
    return <p className="text-sm text-[var(--color-muted)]">Couldn’t load the certification.</p>
  }
  if (!selected) {
    return <p className="text-sm text-[var(--color-muted)]">No certifications yet.</p>
  }

  const exams = (attempts.data ?? []).filter((item) => item.mode === 'exam' && !item.topic_id)
  const finished = exams.filter((item) => item.completed_at)
  const passed = finished.filter((item) => (item.score ?? 0) >= selected.passing_percent).length
  const failed = finished.length - passed
  const best = finished.reduce((max, item) => Math.max(max, item.score ?? 0), 0)
  const startError =
    start.error instanceof ApiError && start.error.message === 'no questions found'
      ? 'This certification has no questions yet.'
      : start.error
        ? 'Couldn’t start the exam.'
        : null

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-5xl leading-none font-medium tracking-tight">Exam</h1>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            {selected.question_count} questions · {formatMinutes(selected.duration_seconds)} minutes ·{' '}
            {selected.passing_percent}% to pass
          </p>
        </div>
        <button
          type="button"
          disabled={start.isPending}
          onClick={() => start.mutate()}
          className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-[var(--color-on-accent)] hover:bg-[var(--color-accent-deep)] disabled:opacity-60"
        >
          {start.isPending ? 'Preparing…' : 'Start exam'}
        </button>
      </div>
      {startError ? <p className="mt-4 text-sm text-[var(--color-bad)]">{startError}</p> : null}

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-4">
        <Stat label="Passed" value={attempts.isSuccess ? `${passed}/${finished.length}` : '—'} />
        <Stat label="Failed" value={attempts.isSuccess ? String(failed) : '—'} />
        <Stat label="Best score" value={finished.length > 0 ? `${best}%` : '—'} />
        <Stat label="Attempts" value={attempts.isSuccess ? String(exams.length) : '—'} />
      </dl>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-medium">Attempts</h2>
        {exams.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">No practice exams yet.</p>
        ) : (
          <ol className="mt-4 border-t border-[var(--color-line)]">
            {exams.map((attempt) => (
              <ExamRow key={attempt.id} attempt={attempt} passingPercent={selected.passing_percent} />
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-surface)] px-5 py-4">
      <dt className="text-[11px] font-medium tracking-[0.14em] text-[var(--color-muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-2 font-serif text-3xl tracking-tight">{value}</dd>
    </div>
  )
}

function ExamRow({ attempt, passingPercent }: { attempt: Attempt; passingPercent: number }) {
  const done = Boolean(attempt.completed_at)
  const correct = attempt.correct_count ?? 0
  const wrong = Math.max(0, attempt.question_count - correct)
  const passed = (attempt.score ?? 0) >= passingPercent

  return (
    <li className="border-b border-[var(--color-line)]">
      <Link to={`/attempts/${attempt.id}`} className="flex items-center justify-between gap-6 py-4">
        <div>
          <p className="text-sm">{formatWhen(attempt.completed_at ?? attempt.started_at)}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {done
              ? `${correct} correct · ${wrong} incorrect${
                  attempt.duration_seconds != null ? ` · ${formatClock(attempt.duration_seconds)}` : ''
                }`
              : 'You can continue'}
          </p>
        </div>
        {done ? (
          <div className="text-right">
            <p className="font-serif text-3xl leading-none">{attempt.score ?? 0}%</p>
            <p className={`mt-1 text-xs ${passed ? 'text-[var(--color-good)]' : 'text-[var(--color-bad)]'}`}>
              {passed ? 'Passed' : 'Failed'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Unfinished</p>
        )}
      </Link>
    </li>
  )
}
