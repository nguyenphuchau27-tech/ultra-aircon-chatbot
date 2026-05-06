import type { AppProps } from 'next/app'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  clearAuth,
  getAccessToken,
  isTokenValid,
  tryRefreshAccessToken,
} from '../services/auth'
import '../app/globals.css'

type GuardStatus = 'checking' | 'ready'

const PUBLIC_PATHS = ['/login']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname)
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [guardStatus, setGuardStatus] = useState<GuardStatus>('checking')

  const pathname = useMemo(() => {
    if (!router.pathname) return '/'
    return router.pathname
  }, [router.pathname])

  useEffect(() => {
    let cancelled = false

    async function runGuard() {
      setGuardStatus('checking')

      const currentPath = pathname || '/'
      const publicPath = isPublicPath(currentPath)

      const accessToken = getAccessToken()

      if (accessToken && isTokenValid(accessToken)) {
        if (cancelled) return

        setGuardStatus('ready')

        if (publicPath) {
          await router.replace('/global_map')
        }

        return
      }

      const refreshedToken = await tryRefreshAccessToken()

      if (cancelled) return

      if (refreshedToken && isTokenValid(refreshedToken)) {
        setGuardStatus('ready')

        if (publicPath) {
          await router.replace('/global_map')
        }

        return
      }

      clearAuth()
      setGuardStatus('ready')

      if (!publicPath) {
        await router.replace('/login')
      }
    }

    void runGuard()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (guardStatus === 'checking') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
        }}
      >
        Checking session...
      </div>
    )
  }

  return <Component {...pageProps} />
}