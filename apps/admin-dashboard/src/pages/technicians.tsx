import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function Technicians() {
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
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            MVP LIMITED
          </div>

          <h1
            style={{
              margin: '0 0 12px',
              fontSize: '28px',
              lineHeight: 1.2,
              color: '#111827',
            }}
          >
            Technician list page chưa được mở trong Phase 4
          </h1>

          <p
            style={{
              margin: '0 0 24px',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#4b5563',
            }}
          >
            Dữ liệu technician hiện đang được phục vụ qua luồng chính ở Global Map.
            Trang danh sách riêng này tạm thời được khóa để tránh gây hiểu nhầm rằng
            toàn bộ dashboard đã hoàn thiện.
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
            Mở Global Map
          </Link>
        </div>
      </main>
    </div>
  );
}