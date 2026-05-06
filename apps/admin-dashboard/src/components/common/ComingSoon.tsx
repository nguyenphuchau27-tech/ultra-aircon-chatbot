'use client'

import Link from 'next/link'

type ComingSoonProps = {
  title: string
  description?: string
}

export default function ComingSoon({
  title,
  description = 'Tính năng này hiện chưa nằm trong phạm vi MVP của Phase 4.',
}: ComingSoonProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: 24,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 20,
          padding: '40px 32px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 12px',
            borderRadius: 999,
            background: '#eff6ff',
            color: '#1d4ed8',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.3,
            marginBottom: 18,
          }}
        >
          MVP Scope Control
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 36,
            lineHeight: 1.2,
            color: '#0f172a',
            fontWeight: 800,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            marginTop: 16,
            marginBottom: 0,
            fontSize: 18,
            color: '#334155',
            fontWeight: 600,
          }}
        >
          Coming Soon
        </p>

        <p
          style={{
            marginTop: 14,
            marginBottom: 0,
            fontSize: 15,
            lineHeight: 1.8,
            color: '#64748b',
          }}
        >
          {description}
          <br />
          Trang này được giữ lại để bảo toàn route và tránh phá build, nhưng chưa mở cho production use.
        </p>

        <div
          style={{
            marginTop: 28,
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/global_map"
            style={{
              textDecoration: 'none',
              padding: '12px 18px',
              borderRadius: 10,
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            Go to Global Map
          </Link>

          <Link
            href="/orders"
            style={{
              textDecoration: 'none',
              padding: '12px 18px',
              borderRadius: 10,
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 700,
              border: '1px solid #cbd5e1',
            }}
          >
            Go to Orders
          </Link>
        </div>
      </div>
    </div>
  )
}