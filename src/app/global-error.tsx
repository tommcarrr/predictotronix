'use client';

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Something went wrong
        </h2>
        <button
          onClick={unstable_retry}
          style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
