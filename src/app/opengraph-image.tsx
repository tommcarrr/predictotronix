import { ImageResponse } from 'next/og';
import { getDailySocialShareVariant } from '@/lib/brand/system-copy';

export const alt = 'Predictotronix Premier League predictions — normal operation assured';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 86400;

const scores = [
  { home: 'ARS', homeScore: '2', awayScore: '1', away: 'LIV' },
  { home: 'MCI', homeScore: '3', awayScore: '0', away: 'TOT' },
];

export default function OpenGraphImage() {
  const variant = getDailySocialShareVariant();

  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#050505',
        boxSizing: 'border-box',
        color: '#f4f4f0',
        display: 'flex',
        fontFamily: 'monospace',
        height: '100%',
        justifyContent: 'center',
        padding: '42px',
        width: '100%',
      }}
    >
      <div
        style={{
          border: '4px solid #00e5ff',
          boxSizing: 'border-box',
          boxShadow: '12px 12px 0 #ffe600',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '34px 42px',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            borderBottom: '3px solid #00e5ff',
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '20px',
          }}
        >
          <div
            style={{
              color: '#ffe600',
              display: 'flex',
              fontSize: 54,
              fontWeight: 900,
              letterSpacing: '-3px',
            }}
          >
            PREDICTOTRONIX
          </div>
          <div
            style={{
              background: '#00e5ff',
              color: '#050505',
              display: 'flex',
              fontSize: 22,
              fontWeight: 800,
              padding: '9px 14px',
            }}
          >
            {variant.status}
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '530px',
            }}
          >
            <div
              style={{
                color: '#00e5ff',
                display: 'flex',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '3px',
                marginBottom: '14px',
              }}
            >
              PREMIER LEAGUE
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 58,
                fontWeight: 900,
                letterSpacing: '-2px',
                lineHeight: 1.02,
              }}
            >
              {variant.headline.map((line, index) => (
                <span
                  key={line}
                  style={index === variant.headline.length - 1 ? { color: '#ffe600' } : undefined}
                >
                  {line}
                </span>
              ))}
              <span
                style={{
                  color: '#b8b8b0',
                  fontSize: 22,
                  letterSpacing: '1px',
                  marginTop: '18px',
                }}
              >
                {variant.subheading}
              </span>
            </div>
          </div>

          <div
            style={{
              border: '3px solid #f4f4f0',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 24px',
              width: '425px',
            }}
          >
            <div
              style={{
                color: '#00e5ff',
                display: 'flex',
                fontSize: 20,
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span>FULL TIME</span>
              <span>GW 24</span>
            </div>
            {scores.map((score) => (
              <div
                key={score.home}
                style={{
                  alignItems: 'center',
                  borderTop: '2px solid #343434',
                  display: 'flex',
                  fontSize: 38,
                  fontWeight: 800,
                  justifyContent: 'space-between',
                  padding: '13px 0',
                }}
              >
                <span style={{ display: 'flex', width: '90px' }}>{score.home}</span>
                <span
                  style={{
                    color: '#ffe600',
                    display: 'flex',
                    justifyContent: 'center',
                    width: '110px',
                  }}
                >
                  {score.homeScore} - {score.awayScore}
                </span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', width: '90px' }}>
                  {score.away}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            borderTop: '3px solid #00e5ff',
            color: '#b8b8b0',
            display: 'flex',
            fontSize: 15,
            justifyContent: 'space-between',
            letterSpacing: '1px',
            paddingTop: '16px',
          }}
        >
          <span style={{ display: 'flex', maxWidth: '835px' }}>
            {variant.reassurance.toUpperCase()}
          </span>
          <span style={{ color: '#ffe600' }}>● NORMAL</span>
        </div>
      </div>
    </div>,
    size
  );
}
