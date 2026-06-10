import { NextRequest, NextResponse } from 'next/server';

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

    // 2. Envoyer email de bienvenue au lead avec lien d'inscription
    const resendApiKey = process.env['RESEND_API_KEY'];
    if (resendApiKey) {
      const registerUrl = 'https://psylib.eu/register';

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'PsyLib <noreply@send.psylib.eu>',
          to: [email],
          subject: 'Bienvenue sur PsyLib — Créez votre compte gratuitement',
          html: `
            <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1E1B4B;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #3D52A0; margin: 0;">PsyLib</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">La plateforme tout-en-un pour psy lib&eacute;raux</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Bonjour,</p>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                Merci pour votre int&eacute;r&ecirc;t pour PsyLib ! Vous pouvez d&eacute;marrer d&egrave;s maintenant avec le <strong style="color: #3D52A0;">plan gratuit</strong>, sans carte bancaire.
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 16px;">
                Le plan gratuit inclut : jusqu&apos;&agrave; 15 patients, s&eacute;ances illimit&eacute;es et comptabilit&eacute; int&eacute;gr&eacute;e. Passez au plan Solo ou Pro quand vous le souhaitez pour l&apos;IA, la visio et le portail patient.
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                Cr&eacute;ez votre compte en un clic :
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${registerUrl}" style="display: inline-block; background-color: #3D52A0; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Cr&eacute;er mon compte
                </a>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 24px;">
                Une question ? R&eacute;pondez directement &agrave; cet email ou contactez-moi &agrave; <a href="mailto:tony@psylib.eu" style="color: #3D52A0;">tony@psylib.eu</a>.
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #64748b;">Tony &mdash; Fondateur PsyLib</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                PsyLib &mdash; H&eacute;berg&eacute; en France (HDS) &mdash; Donn&eacute;es de sant&eacute; prot&eacute;g&eacute;es
              </p>
            </div>
          `,
          reply_to: 'tony@psylib.eu',
        }),
      }).catch((err) => console.error('[leads] Resend welcome email error:', err));

      // 3. Notifier l'admin
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'PsyLib Leads <noreply@send.psylib.eu>',
          to: ['tony@psylib.eu'],
          subject: `Nouveau lead PsyLib — ${email}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #3D52A0; margin-bottom: 8px;">Nouveau lead PsyLib</h2>
              <p style="color: #666; margin-bottom: 16px;">Un email de bienvenue avec lien d&apos;inscription a &eacute;t&eacute; envoy&eacute; automatiquement.</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 12px; background: #f1f0f9; font-weight: 600; width: 100px;">Email</td>
                  <td style="padding: 8px 12px; background: #f8f7ff;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #f1f0f9; font-weight: 600;">Source</td>
                  <td style="padding: 8px 12px; background: #f8f7ff;">landing_beta</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #f1f0f9; font-weight: 600;">IP</td>
                  <td style="padding: 8px 12px; background: #f8f7ff;">${ip}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #f1f0f9; font-weight: 600;">Date</td>
                  <td style="padding: 8px 12px; background: #f8f7ff;">${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</td>
                </tr>
              </table>
            </div>
          `,
        }),
      }).catch((err) => console.error('[leads] Resend admin notification error:', err));
    } else {
      console.warn('[leads] RESEND_API_KEY non configuré — emails désactivés');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[leads] Error:', err);
    return NextResponse.json({ success: true });
  }
}
