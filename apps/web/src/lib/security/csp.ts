/**
 * Construction de la Content-Security-Policy avec nonce (mode durci).
 *
 * ⚠️ SYNCHRONISER avec le bloc CSP statique de `next.config.mjs` (chemin flag OFF) :
 * seul `script-src` diffère (nonce ici vs 'unsafe-inline' là). Les autres directives
 * doivent rester identiques.
 *
 * Activé uniquement quand l'env `CSP_NONCE === 'true'` (cf. middleware). Tant que le flag
 * est OFF, c'est `next.config.mjs` qui sert la CSP (avec 'unsafe-inline').
 */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const livekitWsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || '';

/**
 * script-src avec nonce + strict-dynamic.
 * - 'nonce-X' + 'strict-dynamic' : navigateurs modernes → seuls les scripts noncés
 *   (et ceux qu'ils chargent dynamiquement, ex. Crisp/PostHog/Sentry) sont autorisés.
 *   'unsafe-inline' et les hôtes (https:) sont IGNORÉS par ces navigateurs.
 * - 'unsafe-inline' https: : fallback CSP1/2 pour vieux navigateurs (qui ignorent nonce).
 * - 'wasm-unsafe-eval' : compilation WASM LiveKit (krisp noise filter + background blur).
 */
function buildScriptSrc(nonce: string): string {
  return `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval' https: 'unsafe-inline'`;
}

/** CSP complète avec nonce (mode durci). */
export function buildCspWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    buildScriptSrc(nonce),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    `connect-src 'self' ${apiUrl} ${wsUrl} ${keycloakUrl} ${livekitWsUrl} https://eu.posthog.com https://eu.i.posthog.com https://o4511050353475584.ingest.de.sentry.io https://client.crisp.chat wss://client.relay.crisp.chat`,
    "media-src 'self' blob: mediastream:",
    "worker-src 'self' blob:",
    "frame-src 'self' https://game.crisp.chat",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/** Génère un nonce base64 unguessable (Web Crypto, dispo edge + node). */
export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}

/** Le mode nonce est-il activé ? (flag env, défaut OFF) */
export function isCspNonceEnabled(): boolean {
  return process.env.CSP_NONCE === 'true';
}
