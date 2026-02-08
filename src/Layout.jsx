export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0b0f14', color: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ background: '#1a1f26', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Balancen (Safe Mode)</h1>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav style={{ background: '#1a1f26', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 0', display: 'flex', justifyContent: 'space-around' }}>
        <a href="/" style={{ color: '#14b8a6', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Home</a>
        <a href="/Social" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Social</a>
        <a href="/Progress" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Progress</a>
        <a href="/Profile" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Profile</a>
      </nav>
    </div>
  );
}