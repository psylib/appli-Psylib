import { SetMetadata } from '@nestjs/common';

/**
 * Markers read by {@link GlobalAuthGuard} to decide whether the global Keycloak
 * authentication applies to a route.
 *
 * Defense-in-depth: with the global guard enabled, authentication is opt-OUT
 * (fail-closed) instead of opt-in. A newly added controller is protected by
 * default; it must explicitly declare why it is reachable without a Keycloak
 * token.
 */

export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Route requires NO authentication at all. Use for webhooks (signature-verified),
 * OAuth callbacks, public directory/booking pages and one-time token links
 * (invitations, consents, guest video join).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const IS_ALT_AUTH_KEY = 'auth:isAltAuth';

/**
 * Route authenticates via its OWN `@UseGuards` (the patient or guardian HS256
 * JWT strategy), not Keycloak. The global Keycloak guard must defer to that
 * route-level guard rather than reject the (non-Keycloak) token.
 */
export const AltAuth = () => SetMetadata(IS_ALT_AUTH_KEY, true);
