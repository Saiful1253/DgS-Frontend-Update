import Link from "next/link";


export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ef 100%)' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 400 }}>
        <svg width="64" height="64" fill="none" viewBox="0 0 64 64" style={{ marginBottom: '1.5rem' }}>
          <circle cx="32" cy="32" r="32" fill="#fee2e2"/>
          <path d="M32 20v16" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="32" cy="44" r="2.5" fill="#dc2626"/>
        </svg>
        <h1 style={{ fontSize: '2.5rem', color: '#dc2626', fontWeight: 700, marginBottom: '0.5rem' }}>404</h1>
        <p style={{ fontSize: '1.15rem', color: '#334155', marginBottom: '0.5rem', textAlign: 'center' }}>
          Oops! The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link href="/" style={{ marginTop: '1.2rem', color: '#fff', background: '#2563eb', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 500, fontSize: '1rem', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
