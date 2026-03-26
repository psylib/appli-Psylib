import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Tarifs PsyLib — Logiciel psychologue libéral';
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
          background: 'linear-gradient(135deg, #3D52A0 0%, #7B9CDA 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
          PsyLib — Tarifs
        </p>
        <h1 style={{ fontSize: '56px', fontWeight: 800, color: 'white', margin: '0 0 32px 0' }}>
          À partir de 43€/mois
        </h1>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { name: 'Starter', price: '43€' },
            { name: 'Pro', price: '69,99€' },
            { name: 'Scale', price: '119,99€' },
          ].map((plan) => (
            <div
              key={plan.name}
              style={{
                padding: '20px 32px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)' }}>{plan.name}</span>
              <span style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginTop: '4px' }}>
                {plan.price}
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>/mois</span>
            </div>
          ))}
        </div>
        <p style={{ position: 'absolute', bottom: '32px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          14 jours gratuits — sans carte bancaire
        </p>
      </div>
    ),
    { ...size },
  );
}
