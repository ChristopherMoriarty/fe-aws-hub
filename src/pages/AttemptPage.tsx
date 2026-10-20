import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { fetchAttempt, submitAttempt } from '../api/attempts'
import { fetchAnswerKey } from '../api/catalog'
import { useCertifications } from '../hooks/useCatalog'
import { formatClock, optionLetter, optionText } from '../lib/format'
import type { Attempt, AttemptQuestion } from '../types/attempt'

export function AttemptPage() {
  const { attemptId = '' } = useParams()
  const queryClient = useQueryClient()
  const attemptQuery = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => fetchAttempt(attemptId),
    enabled: Boolean(attemptId),
  })
  const certifications = useCertifications()

  if (attemptQuery.isLoading) {
    return <div className="h-40 rounded-3xl bg-[var(--color-surface-2)]" />
  }
  if (!attemptQuery.data?.questions?.length) {
    return <p className="text-sm text-[var(--color-muted)]">Attempt not found.</p>
  }

  const attempt = attemptQuery.data
  const passing =
    certifications.data?.find((item) => item.id === attempt.certification_id)?.passing_percent ?? 72

  if (attempt.completed_at) {
    return <Result attempt={attempt} passingPercent={passing} />
  }

  return (
    <OpenAttempt
      attempt={attempt}
      onSubmitted={(next) => {
        queryClient.setQueryData(['attempt', attemptId], next)
        void queryClient.invalidateQueries({ queryKey: ['stats'] })
        void queryClient.invalidateQueries({ queryKey: ['progress'] })
        void queryClient.invalidateQueries({ queryKey: ['attempts'] })
      }}
    />
  )
}

function OpenAttempt({
  attempt,
  onSubmitted,
}: {
  attempt: Attempt
  onSubmitted: (attempt: Attempt) => void
}) {
  const questions = useMemo(
    () => [...(attempt.questions ?? [])].sort((a, b) => a.position - b.position),
    [attempt.questions],
  )
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>(() => readAnswers(attempt.id))
  const [checks, setChecks] = useState<Record<string, Check>>(() => readChecks(attempt.id))
  const [now, setNow] = useState(() => Date.now())
  const certifications = useCertifications()
  const expired = useRef(false)
  const topicTest = Boolean(attempt.topic_id)
  const practice = attempt.mode === 'learning'
  const timed = !practice

  useEffect(() => {
    sessionStorage.setItem(storageKey(attempt.id), JSON.stringify(answers))
  }, [answers, attempt.id])

  useEffect(() => {
    sessionStorage.setItem(checksKey(attempt.id), JSON.stringify(checks))
  }, [checks, attempt.id])

  useEffect(() => {
    if (!timed) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [timed])

  const durationLimit = certifications.data?.find((item) => item.id === attempt.certification_id)
    ?.duration_seconds
  const elapsed = Math.round((now - new Date(attempt.started_at).getTime()) / 1000)
  const remaining = durationLimit == null ? null : durationLimit - elapsed
  const question = questions[index]
  const selected = new Set(answers[question.id] ?? [])
  const verdict = checks[question.id]

  const submit = useMutation({
    mutationFn: () =>
      submitAttempt(attempt.id, {
        duration_seconds: Math.max(0, elapsed),
        answers: questions.map((item) => ({
          question_id: item.id,
          option_ids: answers[item.id] ?? [],
        })),
      }),
    onSuccess: (next) => {
      sessionStorage.removeItem(storageKey(attempt.id))
      sessionStorage.removeItem(checksKey(attempt.id))
      onSubmitted(next)
    },
  })

  const check = useMutation({
    mutationFn: async (questionId: string) => {
      const key = await fetchAnswerKey(questionId)
      const correctIds = key.options.filter((option) => option.is_correct).map((option) => option.id)
      const chosen = answers[questionId] ?? []
      return {
        questionId,
        correct: sameSet(correctIds, chosen),
        correctIds,
        explanation: key.explanation ?? null,
      }
    },
    onSuccess: (result) => {
      setChecks((current) => ({
        ...current,
        [result.questionId]: {
          correct: result.correct,
          correctIds: result.correctIds,
          explanation: result.explanation,
        },
      }))
    },
  })

  useEffect(() => {
    if (expired.current || !timed || remaining == null || remaining > 0) return
    expired.current = true
    submit.mutate()
  }, [timed, remaining, submit])

  const toggle = (optionId: string) => {
    if (verdict) return
    setAnswers((current) => {
      const next = new Set(current[question.id] ?? [])
      if (next.has(optionId)) next.delete(optionId)
      else next.add(optionId)
      return { ...current, [question.id]: [...next] }
    })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
        <p>
          {topicTest ? 'Topic' : attempt.mode === 'exam' ? 'Exam' : 'Practice'} · {index + 1} of{' '}
          {questions.length}
        </p>
        {timed && remaining != null ? (
          <p className={`tabular-nums ${remaining < 60 ? 'text-[var(--color-bad)]' : ''}`}>
            {formatClock(remaining)}
          </p>
        ) : null}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-full bg-[var(--color-accent)]"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <article className="mt-10">
        <h1 className="font-serif text-3xl leading-snug font-medium tracking-tight">{question.body}</h1>
        {question.image_url ? (
          <img
            src={question.image_url}
            alt=""
            className="mt-6 max-h-80 rounded-2xl border border-[var(--color-line)] object-contain"
          />
        ) : null}
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Select every option you think is correct.
        </p>
        <div className="mt-4 space-y-3">
          {sortedOptions(question).map((option, optionIndex) => {
            const active = selected.has(option.id)
            const revealed = verdict?.correctIds.includes(option.id)
            const wrongPick = Boolean(verdict) && active && !revealed
            const tone = revealed
              ? 'border-[var(--color-good)] bg-[var(--color-good-soft)]'
              : wrongPick
                ? 'border-[var(--color-bad)] bg-[var(--color-bad-soft)]'
                : active
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                  : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-line-strong)]'
            return (
              <button
                key={option.id}
                type="button"
                disabled={Boolean(verdict)}
                onClick={() => toggle(option.id)}
                className={`flex w-full gap-4 rounded-2xl border px-4 py-4 text-left transition disabled:cursor-default ${tone}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                    active
                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                  }`}
                >
                  {optionLetter(optionIndex)}
                </span>
                <span className="pt-0.5 text-sm leading-6">{optionText(option.body, optionIndex)}</span>
              </button>
            )
          })}
        </div>
        {practice && !verdict ? (
          <button
            type="button"
            disabled={selected.size === 0 || check.isPending}
            onClick={() => check.mutate(question.id)}
            className="mt-4 text-sm text-[var(--color-accent-deep)] disabled:opacity-40"
          >
            {check.isPending ? 'Checking…' : 'Check answer'}
          </button>
        ) : null}
        {verdict ? (
          <p className={`mt-4 text-sm ${verdict.correct ? 'text-[var(--color-good)]' : 'text-[var(--color-bad)]'}`}>
            {verdict.correct ? 'Correct' : 'Incorrect'}
          </p>
        ) : null}
        {verdict?.explanation ? (
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{verdict.explanation}</p>
        ) : null}
      </article>

      {submit.isError ? (
        <p className="mt-6 text-sm text-[var(--color-bad)]">Couldn’t submit your answers.</p>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
        {questions.map((item, itemIndex) => {
          const result = checks[item.id]
          const answered = (answers[item.id]?.length ?? 0) > 0
          const current = itemIndex === index
          const tone = result
            ? result.correct
              ? 'border-[var(--color-good)] bg-[var(--color-good-soft)] text-[var(--color-good)]'
              : 'border-[var(--color-bad)] bg-[var(--color-bad-soft)] text-[var(--color-bad)]'
            : current
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-on-accent)]'
              : answered
                ? 'border-[var(--color-line-strong)] bg-[var(--color-surface)]'
                : 'border-[var(--color-line)] text-[var(--color-muted)]'
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              className={`h-8 w-8 rounded-lg border text-xs ${tone} ${
                current && result ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg)]' : ''
              }`}
            >
              {itemIndex + 1}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((value) => value - 1)}
          className="text-sm text-[var(--color-muted)] disabled:opacity-30"
        >
          Back
        </button>
        {index < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex((value) => value + 1)}
            className="rounded-2xl bg-[var(--color-text)] px-5 py-3 text-sm text-[var(--color-bg)]"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={submit.isPending}
            onClick={() => submit.mutate()}
            className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-[var(--color-on-accent)] disabled:opacity-60"
          >
            {submit.isPending ? 'Submitting…' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  )
}

function Result({ attempt, passingPercent }: { attempt: Attempt; passingPercent: number }) {
  const questions = [...(attempt.questions ?? [])].sort((a, b) => a.position - b.position)
  const score = attempt.score ?? 0
  const passed = score >= passingPercent

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[11px] font-medium tracking-[0.18em] text-[var(--color-muted)] uppercase">
        Result
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-serif text-7xl leading-none tracking-tight">{score}%</p>
          <p className={`mt-3 text-sm ${passed ? 'text-[var(--color-good)]' : 'text-[var(--color-bad)]'}`}>
            {passed ? 'Passing score reached' : `Need ${passingPercent}%`}
          </p>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          {attempt.correct_count ?? 0} of {attempt.question_count} correct
        </p>
      </div>

      <ol className="mt-12 space-y-8">
        {questions.map((question) => (
          <li key={question.id} className="border-t border-[var(--color-line)] pt-6">
            <p className={`text-xs ${question.is_correct ? 'text-[var(--color-good)]' : 'text-[var(--color-bad)]'}`}>
              Question {question.position}
            </p>
            <h2 className="mt-2 text-lg leading-7">{question.body}</h2>
            <div className="mt-4 space-y-2">
              {sortedOptions(question).map((option, optionIndex) => {
                const chosen = question.selected_option_ids?.includes(option.id)
                const correct = option.is_correct === true
                const tone = correct
                  ? 'border-[var(--color-good)] bg-[var(--color-good-soft)]'
                  : chosen
                    ? 'border-[var(--color-bad)] bg-[var(--color-bad-soft)]'
                    : 'border-[var(--color-line)]'
                return (
                  <div key={option.id} className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${tone}`}>
                    <span className="mr-3 text-[var(--color-muted)]">{optionLetter(optionIndex)}</span>
                    {optionText(option.body, optionIndex)}
                  </div>
                )
              })}
            </div>
            {question.explanation ? (
              <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">{question.explanation}</p>
            ) : null}
          </li>
        ))}
      </ol>

      <Link
        to={attempt.mode === 'exam' && !attempt.topic_id ? '/exam' : '/'}
        className="mt-10 inline-block text-sm text-[var(--color-accent-deep)]"
      >
        {attempt.mode === 'exam' && !attempt.topic_id ? 'Back to exam' : 'Back to topics'}
      </Link>
    </div>
  )
}

function sortedOptions(question: AttemptQuestion) {
  return [...question.options].sort((a, b) => a.sort_order - b.sort_order)
}

interface Check {
  correct: boolean
  correctIds: string[]
  explanation?: string | null
}

function sameSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  const values = new Set(left)
  return right.every((id) => values.has(id))
}

function storageKey(attemptId: string) {
  return `aws-hub.attempt.${attemptId}`
}

function checksKey(attemptId: string) {
  return `aws-hub.attempt.${attemptId}.checks`
}

function readChecks(attemptId: string) {
  try {
    const raw = sessionStorage.getItem(checksKey(attemptId))
    return raw ? (JSON.parse(raw) as Record<string, Check>) : {}
  } catch {
    return {}
  }
}

function readAnswers(attemptId: string) {
  try {
    const raw = sessionStorage.getItem(storageKey(attemptId))
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
  } catch {
    return {}
  }
}
