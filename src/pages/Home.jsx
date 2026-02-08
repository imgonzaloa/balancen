export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #134e4a, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'white', marginBottom: '16px' }}>
          Balancen
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)' }}>
          Your balance starts here
        </p>
      </div>
    </div>
  );
}