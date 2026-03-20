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
 * CORS origin callback — accepte les origines listees + `null` (apps mobiles natives).
 * Les apps React Native envoient `Origin: null` car elles ne sont pas dans un navigateur.
 */
export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  // Les apps natives envoient origin=undefined ou origin=null
  if (!origin) {
    callback(null, true);
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
