import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * KeycloakGuard — Protège les routes avec JWT Keycloak
 *
 * Utilisation :
 * @UseGuards(KeycloakGuard)
 * @Get('protected-route')
 */
@Injectable()
export class KeycloakGuard extends AuthGuard('keycloak-jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Token Keycloak invalide ou expiré');
    }
    return user;
  }
}
