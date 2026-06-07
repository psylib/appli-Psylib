import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY, IS_ALT_AUTH_KEY } from '../decorators/public.decorator';

/**
 * GlobalAuthGuard — fail-closed Keycloak authentication for the whole API.
 *
 * Registered as an APP_GUARD so every route requires a valid Keycloak token
 * UNLESS it is marked {@link Public} (no auth) or {@link AltAuth} (authenticates
 * via its own patient/guardian guard). This closes the historical fail-open hole
 * where forgetting `@UseGuards` left an endpoint silently unprotected.
 *
 * Rollout safety: disabled by default. The legacy per-controller `@UseGuards`
 * already protect every sensitive route, so enabling this changes nothing for
 * correctly-decorated routes — it only catches *undecorated* ones. Set
 * `GLOBAL_AUTH_GUARD=true` after a staging smoke test of the public flows
 * (Stripe/Google webhooks, OAuth callback, public booking, guest video join,
 * invitation/consent token links, patient & guardian portals). Set it back to
 * anything but `true` to instantly revert.
 */
@Injectable()
export class GlobalAuthGuard extends AuthGuard('keycloak-jwt') {
  private readonly enabled: boolean;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    super();
    this.enabled = config.get<string>('GLOBAL_AUTH_GUARD') === 'true';
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    if (!this.enabled) return true;

    const skip =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ||
      this.reflector.getAllAndOverride<boolean>(IS_ALT_AUTH_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    if (skip) return true;

    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Authentification requise');
    }
    return user;
  }
}
