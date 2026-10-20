import { apiFetch } from './client'
import type { Attempt, StartAttemptInput } from '../types/attempt'

export function startAttempt(certificationId: string, input: StartAttemptInput) {
  return apiFetch<Attempt>(`/api/v1/certifications/${certificationId}/attempts`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchAttempt(attemptId: string) {
  return apiFetch<Attempt>(`/api/v1/attempts/${attemptId}`)
}

export function fetchAttempts(certificationId: string) {
  return apiFetch<Attempt[]>(`/api/v1/certifications/${certificationId}/attempts`)
}

export function submitAttempt(
  attemptId: string,
  input: { duration_seconds?: number; answers: { question_id: string; option_ids: string[] }[] },
) {
  return apiFetch<Attempt>(`/api/v1/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
