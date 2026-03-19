import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

const VALID_SLUGS = ['kit-demarrage-cabinet', 'templates-notes-tcc', 'guide-tarifs-facturation'];

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

  const lastSubmit = rateLimitMap.get(ip);
  if (lastSubmit && Date.now() - lastSubmit < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'Trop de demandes. Veuillez reessayer dans une heure.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide' }, { status: 400 });
  }

  const parsed = body as Record<string, unknown> | null;
  const email = parsed && typeof parsed === 'object' && 'email' in parsed
    ? String(parsed.email).trim().toLowerCase()
    : '';
  const slug = parsed && typeof parsed === 'object' && 'slug' in parsed
    ? String(parsed.slug).trim()
    : '';

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  if (!slug || !VALID_SLUGS.includes(slug)) {
    return NextResponse.json({ error: 'Ressource invalide' }, { status: 400 });
  }

  try {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'https://api.psylib.eu';
    const apiRes = await fetch(`${apiUrl}/api/v1/lead-magnets/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, slug }),
    }).catch((err) => {
      console.warn('[lead-magnets] API unavailable:', err);
      return null;
    });

    if (apiRes && !apiRes.ok) {
      console.warn(`[lead-magnets] API responded ${apiRes.status}`);
    }

    rateLimitMap.set(ip, Date.now());
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[lead-magnets] Error:', err);
    rateLimitMap.set(ip, Date.now());
    return NextResponse.json({ success: true });
  }
}
