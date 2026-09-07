'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'system-ui, sans-serif',
          flexDirection: 'column',
          gap: '16px',
          textAlign: 'center',
          padding: '24px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            margin: '0 auto',
          }}>
            ⚠️
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              An unexpected error occurred.
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#7C3AED',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
