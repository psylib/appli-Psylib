import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting: IP → timestamp
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

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit check
  const lastSubmit = rateLimitMap.get(ip);
  if (lastSubmit && Date.now() - lastSubmit < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'Trop de demandes. Veuillez réessayer dans une heure.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const email =
    body !== null && typeof body === 'object' && 'email' in body
      ? String((body as Record<string, unknown>).email).trim().toLowerCase()
      : '';

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  try {
    // 1. Sauvegarder le lead dans l'API NestJS
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'https://api.psylib.eu';
    const apiRes = await fetch(`${apiUrl}/api/v1/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'landing_beta', ip }),
    }).catch((err) => {
      console.warn('[leads] API unavailable:', err);
      return null;
    });

    if (apiRes && !apiRes.ok) {
      console.warn(`[leads] API responded ${apiRes.status}`);
    }

    // 2. Notifier par email à l'adresse admin via Resend
    const resendApiKey = process.env['RESEND_API_KEY'];
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'PsyLib Leads <noreply@psylib.eu>',
          to: ['psylib.eu@gmail.com'],
          subject: `🔔 Nouveau lead PsyLib — ${email}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #7B9E87; margin-bottom: 8px;">Nouveau lead landing PsyLib</h2>
              <p style="color: #666; margin-bottom: 16px;">Un nouveau visiteur vient de s'inscrire.</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 12px; background: #f7f3ee; font-weight: 600; width: 100px; border-radius: 4px 0 0 4px;">Email</td>
                  <td style="padding: 8px 12px; background: #fdfaf7; border-radius: 0 4px 4px 0;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #f7f3ee; font-weight: 600; border-radius: 4px 0 0 4px; margin-top: 4px;">Source</td>
                  <td style="padding: 8px 12px; background: #fdfaf7; border-radius: 0 4px 4px 0;">landing_beta</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #f7f3ee; font-weight: 600; border-radius: 4px 0 0 4px;">IP</td>
                  <td style="padding: 8px 12px; background: #fdfaf7; border-radius: 0 4px 4px 0;">${ip}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #f7f3ee; font-weight: 600; border-radius: 4px 0 0 4px;">Date</td>
                  <td style="padding: 8px 12px; background: #fdfaf7; border-radius: 0 4px 4px 0;">${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</td>
                </tr>
              </table>
            </div>
          `,
        }),
      }).catch((err) => console.error('[leads] Resend notification error:', err));
    } else {
      console.warn('[leads] RESEND_API_KEY non configuré — notification email désactivée');
    }

    rateLimitMap.set(ip, Date.now());
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[leads] Error:', err);
    rateLimitMap.set(ip, Date.now());
    return NextResponse.json({ success: true });
  }
}
