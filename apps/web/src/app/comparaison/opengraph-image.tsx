import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PsyLib vs alternatives — Comparatif logiciels psychologue';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #F8F7FF 0%, #F1F0F9 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <p style={{ fontSize: '18px', color: '#3D52A0', fontWeight: 600, margin: '0 0 12px 0' }}>
          Comparatif
        </p>
        <h1 style={{ fontSize: '52px', fontWeight: 800, color: '#1E1B4B', margin: '0 0 32px 0' }}>
          PsyLib vs les alternatives
        </h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div
            style={{
              padding: '16px 28px',
              borderRadius: '12px',
              background: '#3D52A0',
              color: 'white',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            PsyLib
          </div>
          <span style={{ fontSize: '24px', color: '#9CA3AF' }}>vs</span>
          {['Excel', 'Doctolib', 'Logiciel générique'].map((alt) => (
            <div
              key={alt}
              style={{
                padding: '16px 24px',
                borderRadius: '12px',
                background: 'white',
                border: '1px solid #E5E7EB',
                color: '#6B7280',
                fontSize: '18px',
                fontWeight: 500,
              }}
            >
              {alt}
            </div>
          ))}
        </div>
        <p style={{ position: 'absolute', bottom: '32px', fontSize: '14px', color: '#9CA3AF' }}>
          psylib.eu/comparaison
        </p>
      </div>
    ),
    { ...size },
  );
}
