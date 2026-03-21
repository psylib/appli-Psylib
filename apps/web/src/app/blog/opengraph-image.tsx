import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Blog PsyLib — Ressources pour psychologues libéraux';
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
          background: 'linear-gradient(135deg, #F8F7FF 0%, #E8E6F0 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#3D52A0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            fontSize: '28px',
            color: 'white',
            fontWeight: 800,
          }}
        >
          P
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: 800, color: '#1E1B4B', margin: '0 0 16px 0' }}>
          Blog PsyLib
        </h1>
        <p style={{ fontSize: '24px', color: '#3D52A0', margin: 0 }}>
          Ressources pour psychologues libéraux
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '32px',
          }}
        >
          {['Gestion cabinet', 'Notes cliniques', 'Facturation', 'Outcome tracking'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                background: 'white',
                border: '1px solid #E5E7EB',
                fontSize: '14px',
                color: '#4B5563',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
        <p style={{ position: 'absolute', bottom: '32px', fontSize: '14px', color: '#9CA3AF' }}>
          psylib.eu/blog
        </p>
      </div>
    ),
    { ...size },
  );
}
