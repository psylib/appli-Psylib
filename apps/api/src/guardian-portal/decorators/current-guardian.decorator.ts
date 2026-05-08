import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { GuardianUser } from '../strategies/guardian-jwt.strategy';

export const CurrentGuardian = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GuardianUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as GuardianUser;
  },
);
