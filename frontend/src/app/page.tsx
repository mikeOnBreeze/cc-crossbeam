export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(180deg, #f0f7f4 0%, #faf6f1 100%)',
      color: '#1c1917',
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        CrossBeam
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#57534e' }}>
        AI ADU Permit Assistant — Coming Soon
      </p>
    </div>
  )
}
