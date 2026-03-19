import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { KeycloakUser } from '../keycloak-jwt.strategy';

interface RequestWithUser {
  user?: KeycloakUser;
}

/**
 * @CurrentUser decorator — Extrait l'utilisateur authentifié du JWT Keycloak
 *
 * Utilisation :
 * @Get('profile')
 * getProfile(@CurrentUser() user: KeycloakUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof KeycloakUser | undefined, ctx: ExecutionContext): KeycloakUser | unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
