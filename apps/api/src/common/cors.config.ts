/**
 * Origines CORS autorisees — partagees entre HTTP (main.ts) et WebSocket (messaging.gateway.ts).
 * Conforme HDS : jamais de wildcard '*'.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>([
    'https://psylib.eu',
    'https://www.psylib.eu',
  ]);

  // Localhost uniquement hors production
  if (process.env['NODE_ENV'] !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:3001');
  }

  const frontendUrl = process.env['FRONTEND_URL'];
  if (frontendUrl) {
    origins.add(frontendUrl);
  }

  return [...origins];
}
