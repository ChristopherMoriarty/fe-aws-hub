/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'

import { useCertifications } from './hooks/useCatalog'
import type { Certification } from './types/catalog'

const STORAGE_KEY = 'aws-hub.certification'

interface Selection {
  certifications: Certification[]
  selected?: Certification
  setCertificationId: (id: string) => void
  isLoading: boolean
  isError: boolean
}

const CertificationContext = createContext<Selection | null>(null)

export function CertificationProvider({ children }: { children: ReactNode }) {
  const query = useCertifications()
  const certifications = query.data ?? []
  const [certificationId, setCertificationId] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? undefined,
  )

  const selected =
    certifications.find((item) => item.id === certificationId) ?? certifications[0]

  const choose = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    setCertificationId(id)
  }

  return (
    <CertificationContext.Provider
      value={{
        certifications,
        selected,
        setCertificationId: choose,
        isLoading: query.isLoading,
        isError: query.isError,
      }}
    >
      {children}
    </CertificationContext.Provider>
  )
}

export function useCertification() {
  const value = useContext(CertificationContext)
  if (!value) throw new Error('useCertification must be used inside CertificationProvider')
  return value
}
