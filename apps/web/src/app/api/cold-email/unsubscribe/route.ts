import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

/**
 * Cold email unsubscribe endpoint.
 *
 * Supports:
 *  - POST with JSON body { email, token } → from the /unsubscribe React page
 *  - POST with query params ?email=&token= → Gmail/Apple "One-Click" (RFC 8058)
 *    (body = `List-Unsubscribe=One-Click`, must return 200 without auth)
 *  - GET with query params ?email=&token= → fallback for plain clients
 *
 * HMAC-SHA256(UNSUBSCRIBE_SECRET, email.toLowerCase().trim()) truncated to 16 chars.
 * Must match scripts/send-cold-emails.ts:makeUnsubToken().
 */

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "";

function makeUnsubToken(email: string): string {
  return crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 16);
}

function verifyToken(email: string, token: string): boolean {
  if (!UNSUBSCRIBE_SECRET) {
    // Fail-open in dev if secret not set (avoid breaking dev)
    console.warn("[unsubscribe] UNSUBSCRIBE_SECRET not set — skipping verification");
    return true;
  }
  if (!email || !token) return false;
  const expected = makeUnsubToken(email);
  // Timing-safe comparison
  if (expected.length !== token.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

async function forwardToSink(email: string, source: string): Promise<void> {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    console.warn("[unsubscribe] GOOGLE_APPS_SCRIPT_URL not configured");
    return;
  }
  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "0",
      },
      body: JSON.stringify({
        action: "add_unsubscribe",
        email: email.toLowerCase().trim(),
        source,
      }),
      redirect: "follow",
    });
    if (!res.ok) {
      console.error("[unsubscribe] Apps Script error:", res.status);
    }
  } catch (err) {
    console.error("[unsubscribe] forward error:", err);
  }
}

async function handleUnsubscribe(
  email: string | null,
  token: string | null,
  source: string,
): Promise<NextResponse> {
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }
  if (!verifyToken(email, token || "")) {
    console.warn("[unsubscribe] invalid token for", email);
    return NextResponse.json({ error: "Token invalide" }, { status: 403 });
  }
  await forwardToSink(email, source);
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Case A — One-Click POST (Gmail/Apple RFC 8058) : query params + body `List-Unsubscribe=One-Click`
  const url = new URL(req.url);
  const qEmail = url.searchParams.get("email");
  const qToken = url.searchParams.get("token");

  if (qEmail) {
    return handleUnsubscribe(qEmail, qToken, "one-click");
  }

  // Case B — React page POST with JSON body { email, token }
  try {
    const body = (await req.json()) as { email?: unknown; token?: unknown };
    const email = typeof body.email === "string" ? body.email : null;
    const token = typeof body.token === "string" ? body.token : null;
    return handleUnsubscribe(email, token, "email_link");
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");
  return handleUnsubscribe(email, token, "get-fallback");
}
