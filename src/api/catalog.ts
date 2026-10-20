import { apiFetch } from './client'
import type { Certification, CertificationStats, Topic, TopicProgress, User } from '../types/catalog'

export function fetchMe() {
  return apiFetch<User>('/api/v1/me')
}

export function fetchCertifications() {
  return apiFetch<Certification[]>('/api/v1/certifications')
}

export function fetchTopics(certificationId: string) {
  return apiFetch<Topic[]>(`/api/v1/certifications/${certificationId}/topics`)
}

export function fetchProgress(certificationId: string) {
  return apiFetch<TopicProgress[]>(`/api/v1/certifications/${certificationId}/progress`)
}

export function fetchStats(certificationId: string) {
  return apiFetch<CertificationStats>(`/api/v1/certifications/${certificationId}/stats`)
}

export interface AnswerKey {
  explanation?: string | null
  options: { id: string; is_correct: boolean }[]
}

export function fetchAnswerKey(questionId: string) {
  return apiFetch<AnswerKey>(`/api/v1/questions/${questionId}`)
}
