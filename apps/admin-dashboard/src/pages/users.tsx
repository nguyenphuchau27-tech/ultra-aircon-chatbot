import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Users() {
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
              background: '#f3f4f6',
              color: '#374151',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            NOT IN CURRENT MVP
          </div>

          <h1
            style={{
              margin: '0 0 12px',
              fontSize: '28px',
              lineHeight: 1.2,
              color: '#111827',
            }}
          >
            Users management sẽ được mở ở phase sau
          </h1>

          <p
            style={{
              margin: '0 0 24px',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#4b5563',
            }}
          >
            Phase 4 hiện tập trung hoàn thiện admin auth flow, production build, global
            map và realtime technician movement. Trang quản lý user chưa được bật để giữ
            dashboard đúng scope MVP.
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
            Quay lại Global Map
          </Link>
        </div>
      </main>
    </div>
  );
}