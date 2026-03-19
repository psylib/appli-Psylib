import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { KeycloakUser } from '../keycloak-jwt.strategy';

interface RequestWithUser {
  user?: KeycloakUser;
}

/**
 * RolesGuard — Vérifie les rôles Keycloak sur les routes protégées
 *
 * Utilisation :
 * @UseGuards(KeycloakGuard, RolesGuard)
 * @Roles('psychologist')
 * @Get('dashboard')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Pas de rôles requis — accessible à tous les authentifiés
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const hasRole = requiredRoles.some(
      (role) => user.role === role || user.roles.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Accès refusé — Rôles requis: ${requiredRoles.join(', ')}. Rôle actuel: ${user.role}`,
      );
    }

    return true;
  }
}
