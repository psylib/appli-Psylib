import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const WEBINARS: Record<string, { title: string; date: string; time: string }> = {
  'rgpd-hds': {
    title: 'RGPD & HDS pour psychologues libéraux',
    date: 'Jeudi 16 avril 2026',
    time: '12h30 (Paris)',
  },
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const lastSubmit = rateLimitMap.get(ip);
  if (lastSubmit && Date.now() - lastSubmit < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'Trop de demandes. Veuillez réessayer dans une heure.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const parsed = body as Record<string, unknown> | null;
  const email =
    parsed && typeof parsed === 'object' && 'email' in parsed
      ? String(parsed.email).trim().toLowerCase()
      : '';
  const name =
    parsed && typeof parsed === 'object' && 'name' in parsed
      ? String(parsed.name).trim()
      : '';
  const city =
    parsed && typeof parsed === 'object' && 'city' in parsed
      ? String(parsed.city).trim().slice(0, 100)
      : '';
  const webinar =
    parsed && typeof parsed === 'object' && 'webinar' in parsed
      ? String(parsed.webinar).trim()
      : '';

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  }
  if (!webinar || !WEBINARS[webinar]) {
    return NextResponse.json({ error: 'Webinaire invalide' }, { status: 400 });
  }

  const webinarInfo = WEBINARS[webinar]!;

  try {
    // 1. Save lead via NestJS API (webinar source)
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'https://api.psylib.eu';
    await fetch(`${apiUrl}/api/v1/leads/webinar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, city, webinar, ip }),
    }).catch((err) => {
      console.warn('[webinar] API unavailable:', err);
    });

    // 2. Send notification to admin
    const resendApiKey = process.env['RESEND_API_KEY'];
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'PsyLib Webinaires <noreply@psylib.eu>',
          to: ['psylib.eu@gmail.com'],
          subject: `Inscription webinaire ${webinar} — ${name}`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #3D52A0; margin: 0 0 16px 0;">Nouvelle inscription webinaire</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 8px; background: #f7f3ee; font-weight: 600; width: 120px;">Webinaire</td><td style="padding: 8px;">${webinarInfo.title}</td></tr>
                <tr><td style="padding: 8px; background: #f7f3ee; font-weight: 600;">Nom</td><td style="padding: 8px;">${name}</td></tr>
                <tr><td style="padding: 8px; background: #f7f3ee; font-weight: 600;">Email</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 8px; background: #f7f3ee; font-weight: 600;">Ville</td><td style="padding: 8px;">${city || '—'}</td></tr>
                <tr><td style="padding: 8px; background: #f7f3ee; font-weight: 600;">IP</td><td style="padding: 8px;">${ip}</td></tr>
              </table>
            </div>
          `,
        }),
      }).catch((err) => console.error('[webinar] Resend notification error:', err));

      // 3. Send confirmation to participant
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'PsyLib <noreply@psylib.eu>',
          to: [email],
          subject: `Inscription confirmée : ${webinarInfo.title}`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; color: #7B9E87; margin: 0;">PsyLib</h1>
              </div>
              <h2 style="font-size: 20px; margin-bottom: 16px;">Bonjour ${name},</h2>
              <p style="line-height: 1.6; color: #444;">
                Votre inscription au webinaire <strong>${webinarInfo.title}</strong> est confirmée.
              </p>
              <div style="background: #f7f3ee; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">📅 Date</p>
                <p style="margin: 4px 0 12px 0; font-weight: 600; color: #1a1a2e;">${webinarInfo.date}</p>
                <p style="margin: 0; font-size: 14px; color: #666;">🕐 Horaire</p>
                <p style="margin: 4px 0 12px 0; font-weight: 600; color: #1a1a2e;">${webinarInfo.time}</p>
                <p style="margin: 0; font-size: 14px; color: #666;">⏱️ Durée</p>
                <p style="margin: 4px 0 0 0; font-weight: 600; color: #1a1a2e;">45 minutes + Q&A</p>
              </div>
              <p style="line-height: 1.6; color: #444;">
                Vous recevrez le <strong>lien Zoom par email 48h avant le webinaire</strong>,
                ainsi qu'un rappel 1h avant.
              </p>
              <p style="line-height: 1.6; color: #444;">
                <strong>Vous ne pourrez pas être en direct ?</strong> Pas de souci, le replay vous sera
                envoyé automatiquement par email 24h après.
              </p>
              <p style="line-height: 1.6; color: #444; margin-top: 24px;">
                À très vite,<br/>
                <strong>Tony</strong><br/>
                <span style="color: #888; font-size: 13px;">Fondateur, PsyLib</span>
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">
                PsyLib — Hébergement HDS France |
                <a href="https://psylib.eu/privacy" style="color: #7B9E87;">Confidentialité</a>
              </p>
            </div>
          `,
        }),
      }).catch((err) => console.error('[webinar] Resend confirmation error:', err));
    }

    rateLimitMap.set(ip, Date.now());
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[webinar] Error:', err);
    rateLimitMap.set(ip, Date.now());
    return NextResponse.json({ success: true });
  }
}
