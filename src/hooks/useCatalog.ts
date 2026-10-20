import { useQuery } from '@tanstack/react-query'

import { fetchAttempts } from '../api/attempts'
import { fetchCertifications, fetchMe, fetchProgress, fetchStats, fetchTopics } from '../api/catalog'

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: fetchMe })
}

export function useCertifications() {
  return useQuery({ queryKey: ['certifications'], queryFn: fetchCertifications })
}

export function useTopics(certificationId: string | undefined) {
  return useQuery({
    queryKey: ['topics', certificationId],
    queryFn: () => fetchTopics(certificationId!),
    enabled: Boolean(certificationId),
  })
}

export function useProgress(certificationId: string | undefined) {
  return useQuery({
    queryKey: ['progress', certificationId],
    queryFn: () => fetchProgress(certificationId!),
    enabled: Boolean(certificationId),
  })
}

export function useStats(certificationId: string | undefined) {
  return useQuery({
    queryKey: ['stats', certificationId],
    queryFn: () => fetchStats(certificationId!),
    enabled: Boolean(certificationId),
  })
}

export function useAttempts(certificationId: string | undefined) {
  return useQuery({
    queryKey: ['attempts', certificationId],
    queryFn: () => fetchAttempts(certificationId!),
    enabled: Boolean(certificationId),
  })
}
