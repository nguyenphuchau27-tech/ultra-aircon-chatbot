'use client'

import './globals.css'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  clearAuth,
  getAccessToken,
  tryRefreshAccessToken,
} from '../services/auth'

type AuthStatus = 'checking' | 'authenticated' | 'guest'

const PUBLIC_PATHS = ['/login']
const AUTHENTICATED_REDIRECT = '/global_map'
const GUEST_REDIRECT = '/login'

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname)
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = atob(padded)

    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function isAccessTokenActive(token: string | null) {
  if (!token) return false

  const payload = decodeJwtPayload(token)
  if (!payload) return false

  const exp = payload.exp
  if (typeof exp !== 'number') return false

  const nowInSeconds = Math.floor(Date.now() / 1000)

  return exp > nowInSeconds
}

function FullScreenMessage({ text }: { text: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        color: '#0f172a',
        background: '#f8fafc',
      }}
    >
      {text}
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')

  const publicPath = useMemo(() => isPublicPath(pathname), [pathname])

  useEffect(() => {
    let cancelled = false

    async function guard() {
      setAuthStatus('checking')

      const currentToken = getAccessToken()

      if (isAccessTokenActive(currentToken)) {
        if (cancelled) return

        setAuthStatus('authenticated')

        if (publicPath) {
          router.replace(AUTHENTICATED_REDIRECT)
        }

        return
      }

      const refreshed = await tryRefreshAccessToken()

      if (cancelled) return

      const refreshedToken = getAccessToken()

      if (refreshed && isAccessTokenActive(refreshedToken)) {
        setAuthStatus('authenticated')

        if (publicPath) {
          router.replace(AUTHENTICATED_REDIRECT)
        }

        return
      }

      clearAuth()
      setAuthStatus('guest')

      if (!publicPath) {
        router.replace(GUEST_REDIRECT)
      }
    }

    void guard()

    return () => {
      cancelled = true
    }
  }, [pathname, publicPath, router])

  return (
    <html lang="en">
      <body>
        {authStatus === 'checking' ? (
          <FullScreenMessage text="Checking session..." />
        ) : authStatus === 'guest' && !publicPath ? null : authStatus === 'authenticated' && publicPath ? null : (
          children
        )}
      </body>
    </html>
  )
}