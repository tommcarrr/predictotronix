import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#050505',
          border: '2px solid #00e5ff',
          color: '#ffe600',
          display: 'flex',
          fontFamily: 'monospace',
          fontSize: 22,
          fontWeight: 800,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        P
      </div>
    ),
    size
  );
}
