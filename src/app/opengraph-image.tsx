import { ImageResponse } from 'next/og';

export const alt =
  'Predictotronix — predict Premier League scores, compete with friends, and climb the table';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const scores = [
  { home: 'ARS', homeScore: '2', awayScore: '1', away: 'LIV' },
  { home: 'MCI', homeScore: '3', awayScore: '0', away: 'TOT' },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
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
              LIVE TABLES
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
                <span>PREDICT.</span>
                <span>COMPETE.</span>
                <span style={{ color: '#ffe600' }}>CLIMB THE TABLE.</span>
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
              fontSize: 20,
              justifyContent: 'space-between',
              letterSpacing: '1px',
              paddingTop: '16px',
            }}
          >
            <span>YOUR SCORES. YOUR LEAGUE. YOUR BRAGGING RIGHTS.</span>
            <span style={{ color: '#ffe600' }}>● ON AIR</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
