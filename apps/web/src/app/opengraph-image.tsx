import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PsyLib — Gestion cabinet psychologue libéral';
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
          background: 'linear-gradient(135deg, #F8F7FF 0%, #F1F0F9 50%, #E8E6F0 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '999px',
            background: '#3D52A010',
            border: '1px solid #3D52A030',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#0D9488',
            }}
          />
          <span style={{ fontSize: '16px', color: '#3D52A0', fontWeight: 600 }}>
            Conforme HDS France
          </span>
        </div>

        {/* Logo */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: '#1E1B4B',
            margin: '0 0 16px 0',
            letterSpacing: '-2px',
          }}
        >
          PsyLib
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '28px',
            color: '#3D52A0',
            margin: '0 0 32px 0',
            fontWeight: 500,
          }}
        >
          L&apos;atelier numérique du psychologue libéral
        </p>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '800px',
          }}
        >
          {[
            'Dossiers patients',
            'Notes cliniques',
            'Outcome tracking',
            'Facturation',
            'IA clinique',
          ].map((feat) => (
            <div
              key={feat}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: 'white',
                border: '1px solid #E8E6F0',
                fontSize: '16px',
                color: '#1E1B4B',
                fontWeight: 500,
              }}
            >
              {feat}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <p
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          psylib.eu — 14 jours gratuits, sans carte bancaire
        </p>
      </div>
    ),
    { ...size },
  );
}
