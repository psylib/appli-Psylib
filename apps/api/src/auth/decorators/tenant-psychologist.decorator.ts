import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Returns the Keycloak user id of the *tenant* psychologist:
 * - for a psychologist/admin: their own `sub`
 * - for an assistant: the userId of the psychologist they are attached to
 * Use for tenant-scoping queries. Keep `user.sub` for the audit actorId.
 */
export const TenantPsychologistUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.user.psychologistUserId;
  },
);
