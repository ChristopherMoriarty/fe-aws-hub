import { API_BASE } from './config'
import { getAccessToken, refreshSession } from './session'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function authorizedFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: withAuth(init?.headers),
  })
  if (response.status !== 401 || path.startsWith('/api/v1/auth/')) return response

  const refreshed = await refreshSession()
  if (!refreshed) return response

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: withAuth(init?.headers),
  })
}

function withAuth(headers?: HeadersInit) {
  const next = new Headers(headers)
  const accessToken = getAccessToken()
  if (accessToken) next.set('Authorization', `Bearer ${accessToken}`)
  return next
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string }
    if (body.error) return body.error
  } catch {
    // The body was not JSON.
  }
  return response.statusText || 'request failed'
}
