'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '../../services/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('12345678')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e?: { preventDefault?: () => void }) {
    e?.preventDefault?.()

    try {
      setLoading(true)
      setError('')

      await login(email, password)
      router.replace('/global_map')
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Login failed'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f7fb',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h1
          style={{
            margin: '0 0 20px',
            fontSize: 32,
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Login
        </h1>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
          >
            Email
          </label>
          <input
            id="email"
            autoComplete="username"
            style={{
              display: 'block',
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              outline: 'none',
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="password"
            style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            style={{
              display: 'block',
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              outline: 'none',
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error ? (
          <p
            style={{
              color: '#dc2626',
              marginBottom: 16,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: 10,
            }}
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: 'none',
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#fff',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}