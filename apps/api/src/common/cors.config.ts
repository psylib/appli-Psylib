/**
 * Origines CORS autorisees — partagees entre HTTP (main.ts) et WebSocket (messaging.gateway.ts).
 * Conforme HDS : jamais de wildcard '*'.
 */
export function getAllowedOrigins(): (string | RegExp)[] {
  const origins: (string | RegExp)[] = [
    'https://psylib.eu',
    'https://www.psylib.eu',
  ];

  // Localhost uniquement hors production
  if (process.env['NODE_ENV'] !== 'production') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:3001');
  }

  const frontendUrl = process.env['FRONTEND_URL'];
  if (frontendUrl) {
    origins.push(frontendUrl);
  }

  return origins;
}

/**
 * CORS origin callback — accepte les origines listees.
 * Les apps mobiles natives (React Native) n'envoient pas d'en-tête Origin
 * et s'authentifient exclusivement via Bearer token — pas de cookie CSRF possible.
 */
export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  // Requêtes sans origine (Postman, curl, apps natives) — acceptées uniquement hors prod.
  if (!origin) {
    const isDev = process.env['NODE_ENV'] !== 'production';
    callback(null, isDev);
    return;
  }

  const allowed = getAllowedOrigins();
  const isAllowed = allowed.some((o) =>
    typeof o === 'string' ? o === origin : o.test(origin),
  );

  if (isAllowed) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  }
}
