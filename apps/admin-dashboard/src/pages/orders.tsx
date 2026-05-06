import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Orders() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '32px' }}>
        <div
          style={{
            maxWidth: '720px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: '999px',
              background: '#fff7ed',
              color: '#c2410c',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            COMING SOON
          </div>

          <h1
            style={{
              margin: '0 0 12px',
              fontSize: '28px',
              lineHeight: 1.2,
              color: '#111827',
            }}
          >
            Orders dashboard chưa nằm trong MVP của Phase 4
          </h1>

          <p
            style={{
              margin: '0 0 24px',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#4b5563',
            }}
          >
            Trang này tạm thời chưa được mở cho luồng vận hành chính của admin dashboard.
            Ở Phase 4, ưu tiên hiện tại là auth guard sạch, global map dữ liệu thật và
            realtime technician movement.
          </p>

          <Link
            href="/global_map"
            style={{
              display: 'inline-block',
              padding: '12px 18px',
              borderRadius: '10px',
              background: '#111827',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Quay về Global Map
          </Link>
        </div>
      </main>
    </div>
  );
}