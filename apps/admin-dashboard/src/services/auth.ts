const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const API_BASE_URL = 'http://localhost:3002/api'

function isBrowser() {
  return typeof window !== 'undefined'
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = atob(padded)

    return JSON.parse(json)
  } catch {
    return null
  }
}

export const getAccessToken = (): string | null => {
  if (!isBrowser()) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const getRefreshToken = (): string | null => {
  if (!isBrowser()) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setAuthTokens = (accessToken: string, refreshToken?: string) => {
  if (!isBrowser()) return

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export const clearAuth = () => {
  if (!isBrowser()) return

  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false

  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return false

  const now = Math.floor(Date.now() / 1000)
  return payload.exp > now
}

let refreshPromise: Promise<string | null> | null = null

export const tryRefreshAccessToken = async (): Promise<string | null> => {
  if (!isBrowser()) return null

  const currentAccessToken = getAccessToken()
  if (isTokenValid(currentAccessToken)) {
    return currentAccessToken
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearAuth()
    return null
  }

  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        clearAuth()
        return null
      }

      const data = await response.json()
      const nextAccessToken =
        typeof data?.accessToken === 'string' ? data.accessToken : null
      const nextRefreshToken =
        typeof data?.refreshToken === 'string' ? data.refreshToken : undefined

      if (!nextAccessToken) {
        clearAuth()
        return null
      }

      setAuthTokens(nextAccessToken, nextRefreshToken)
      return nextAccessToken
    } catch {
      clearAuth()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}