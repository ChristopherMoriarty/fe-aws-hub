import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { startAttempt } from '../api/attempts'
import { ApiError } from '../api/client'
import { useCertification } from '../certification'
import { useProgress, useStats, useTopics } from '../hooks/useCatalog'
import type { StartAttemptInput } from '../types/attempt'

export function TopicsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selected, isLoading, isError } = useCertification()
  const topics = useTopics(selected?.id)
  const progress = useProgress(selected?.id)
  const stats = useStats(selected?.id)

  const start = useMutation({
    mutationFn: (input: StartAttemptInput) => startAttempt(selected!.id, input),
    onSuccess: (attempt) => {
      void queryClient.invalidateQueries({ queryKey: ['attempt', attempt.id] })
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

  const progressByTopic = new Map(progress.data?.map((item) => [item.topic_id, item]))
  const summary = stats.data
  const total = summary?.total_questions ?? 0
  const mastered = summary?.mastered_questions ?? 0
  const review = summary?.needs_review ?? 0
  const attempted = summary?.attempted_questions ?? 0
  const startError =
    start.error instanceof ApiError && start.error.message === 'no questions found'
      ? 'This topic has no questions yet.'
      : start.error
        ? 'Couldn’t start the topic.'
        : null

  return (
    <div>
      <h1 className="font-serif text-5xl leading-none font-medium tracking-tight">Topics</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
        A short set of 10 questions. Answers are checked right away, with no timer.
      </p>
      {startError ? <p className="mt-4 text-sm text-[var(--color-bad)]">{startError}</p> : null}

      <section className="mt-10 rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--color-muted)] uppercase">
              Mastered
            </p>
            <p className="mt-2 font-serif text-5xl leading-none tracking-tight tabular-nums">
              {summary ? mastered : '—'}
              <span className="text-2xl text-[var(--color-muted)]">/{summary ? total : '—'}</span>
            </p>
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            <SummaryFigure label="Seen" value={summary ? String(attempted) : '—'} />
            <SummaryFigure label="To review" value={summary ? String(review) : '—'} tone="review" />
            <SummaryFigure label="Accuracy" value={summary ? `${summary.accuracy}%` : '—'} />
          </dl>
        </div>
        <Meter className="mt-6 h-3" mastered={mastered} review={review} total={total} />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-muted)]">
          <Legend color="var(--color-good)" label="mastered" />
          <Legend color="var(--color-accent)" label="to review" />
          <Legend color="var(--color-surface-2)" label="not started" bordered />
        </div>
      </section>

      <ol className="mt-6 space-y-3">
        {topics.data?.map((topic, index) => {
          const item = progressByTopic.get(topic.id)
          const topicTotal = item?.total_questions ?? 0
          const topicAttempted = item?.attempted_questions ?? 0
          const topicMastered = item?.mastered_questions ?? 0
          const topicReview = Math.max(0, topicAttempted - topicMastered)
          const untouched = Math.max(0, topicTotal - topicAttempted)
          return (
            <li
              key={topic.id}
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] tracking-[0.14em] text-[var(--color-muted)] uppercase">
                    {String(index + 1).padStart(2, '0')}
                    {item?.mastered ? ' · mastered' : ''}
                  </p>
                  <h2 className="mt-1 truncate text-base">{topic.title}</h2>
                </div>
                <button
                  type="button"
                  disabled={start.isPending || topicTotal === 0}
                  onClick={() =>
                    start.mutate({ mode: 'learning', topic_id: topic.id, question_count: 10 })
                  }
                  className="shrink-0 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] hover:bg-[var(--color-accent-deep)] disabled:opacity-40"
                >
                  Start
                </button>
              </div>
              <Meter className="mt-4 h-2" mastered={topicMastered} review={topicReview} total={topicTotal} />
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
                <span className="text-[var(--color-good)]">{topicMastered} mastered</span>
                <span className="text-[var(--color-accent-deep)]">{topicReview} to review</span>
                <span className="text-[var(--color-muted)]">{untouched} not started</span>
                {topicAttempted > 0 ? (
                  <span className="text-[var(--color-muted)]">{item?.accuracy ?? 0}%</span>
                ) : null}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function SummaryFigure({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'review'
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-[0.14em] text-[var(--color-muted)] uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 font-serif text-2xl tabular-nums ${
          tone === 'review' ? 'text-[var(--color-accent-deep)]' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function Meter({
  mastered,
  review,
  total,
  className,
}: {
  mastered: number
  review: number
  total: number
  className?: string
}) {
  const parts = [
    { key: 'mastered', count: mastered, color: 'var(--color-good)' },
    { key: 'review', count: review, color: 'var(--color-accent)' },
  ]
  return (
    <div className={`flex overflow-hidden rounded-full bg-[var(--color-surface-2)] ${className ?? ''}`}>
      {total > 0
        ? parts.map((part) =>
            part.count > 0 ? (
              <div
                key={part.key}
                style={{ width: `${(part.count / total) * 100}%`, background: part.color }}
              />
            ) : null,
          )
        : null}
    </div>
  )
}

function Legend({ color, label, bordered = false }: { color: string; label: string; bordered?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${bordered ? 'border border-[var(--color-line-strong)]' : ''}`}
        style={{ background: color }}
      />
      {label}
    </span>
  )
}
