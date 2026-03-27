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

function isValidAdeli(adeli: string): boolean {
  // ADELI: 9 digits
  return /^\d{9}$/.test(adeli.replace(/\s/g, ''));
}

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
  const email = parsed && typeof parsed === 'object' && 'email' in parsed
    ? String(parsed.email).trim().toLowerCase()
    : '';
  const name = parsed && typeof parsed === 'object' && 'name' in parsed
    ? String(parsed.name).trim()
    : '';
  const adeli = parsed && typeof parsed === 'object' && 'adeli' in parsed
    ? String(parsed.adeli).trim()
    : '';
  const message = parsed && typeof parsed === 'object' && 'message' in parsed
    ? String(parsed.message).trim().slice(0, 500)
    : '';

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  }
  if (adeli && !isValidAdeli(adeli)) {
    return NextResponse.json({ error: 'Numéro ADELI invalide (9 chiffres)' }, { status: 400 });
  }

  try {
    // 1. Save lead + trigger nurturing via NestJS API
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'https://api.psylib.eu';
    await fetch(`${apiUrl}/api/v1/leads/beta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, adeli, message, ip }),
    }).catch((err) => {
      console.warn('[beta] API unavailable:', err);
    });

    // 2. Send notification email via Resend
    const resendApiKey = process.env['RESEND_API_KEY'];
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'PsyLib Bêta <noreply@psylib.eu>',
          to: ['psylib.eu@gmail.com'],
          subject: `Nouveau Fondateur PsyLib — ${name} (${email})`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
              <div style="background: linear-gradient(135deg, #7B9E87 0%, #5a7d66 100%); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: white; margin: 0 0 4px 0; font-size: 18px;">Nouveau candidat Fondateur</h2>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 14px;">Programme Bêta PsyLib</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 10px 12px; background: #f7f3ee; font-weight: 600; width: 120px;">Nom</td>
                  <td style="padding: 10px 12px; background: #fdfaf7;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; background: #f7f3ee; font-weight: 600;">Email</td>
                  <td style="padding: 10px 12px; background: #fdfaf7;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; background: #f7f3ee; font-weight: 600;">ADELI</td>
                  <td style="padding: 10px 12px; background: #fdfaf7;">${adeli || 'Non renseigné'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; background: #f7f3ee; font-weight: 600;">Message</td>
                  <td style="padding: 10px 12px; background: #fdfaf7;">${message || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; background: #f7f3ee; font-weight: 600;">IP</td>
                  <td style="padding: 10px 12px; background: #fdfaf7;">${ip}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; background: #f7f3ee; font-weight: 600;">Date</td>
                  <td style="padding: 10px 12px; background: #fdfaf7;">${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</td>
                </tr>
              </table>
            </div>
          `,
        }),
      }).catch((err) => console.error('[beta] Resend notification error:', err));

      // 3. Send confirmation email to the applicant
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'PsyLib <noreply@psylib.eu>',
          to: [email],
          subject: 'Bienvenue dans le programme Fondateurs PsyLib',
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 24px; color: #7B9E87; margin: 0;">PsyLib</h1>
              </div>
              <h2 style="font-size: 20px; margin-bottom: 16px;">Bonjour ${name},</h2>
              <p style="line-height: 1.6; color: #444;">
                Merci pour votre candidature au programme Fondateurs PsyLib.
              </p>
              <p style="line-height: 1.6; color: #444;">
                Les places sont limitées à <strong>15 praticiens</strong>. En tant que Fondateur, vous bénéficierez :
              </p>
              <ul style="line-height: 1.8; color: #444; padding-left: 20px;">
                <li><strong>Tarif gelé à vie</strong> — 43€/mois, même quand les prix augmentent</li>
                <li><strong>Accès prioritaire</strong> à toutes les nouvelles fonctionnalités</li>
                <li><strong>Ligne directe</strong> avec le fondateur pour façonner le produit</li>
                <li><strong>Badge Fondateur</strong> visible sur votre profil</li>
              </ul>
              <p style="line-height: 1.6; color: #444;">
                Je reviens vers vous dans les 48h pour organiser un appel de bienvenue de 15 minutes.
              </p>
              <p style="line-height: 1.6; color: #444; margin-top: 24px;">
                À très vite,<br/>
                <strong>Tony</strong><br/>
                <span style="color: #888; font-size: 13px;">Fondateur, PsyLib</span>
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">
                PsyLib — Hébergement HDS France | <a href="https://psylib.eu/privacy" style="color: #7B9E87;">Politique de confidentialité</a>
              </p>
            </div>
          `,
        }),
      }).catch((err) => console.error('[beta] Resend confirmation error:', err));
    }

    rateLimitMap.set(ip, Date.now());
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[beta] Error:', err);
    rateLimitMap.set(ip, Date.now());
    return NextResponse.json({ success: true });
  }
}
