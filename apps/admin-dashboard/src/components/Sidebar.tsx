import Link from 'next/link';

export default function Sidebar() {
  return (
    <div
      style={{
        width: '200px',
        background: '#1e293b',
        color: 'white',
        height: '100vh',
        padding: '20px',
      }}
    >
      <h2>Admin</h2>

      <ul>
        <li>
          <Link href="/">Dashboard</Link>
        </li>

        <li>
          <Link href="/users">Users</Link>
        </li>

        <li>
          <Link href="/technicians">Technicians</Link>
        </li>

        <li>
          <Link href="/orders">Orders</Link>
        </li>

        <li>
          <Link href="/analytics">Analytics</Link>
        </li>
      </ul>
    </div>
  );
}
