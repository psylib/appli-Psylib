import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PatientUser } from '../strategies/patient-jwt.strategy';

export const CurrentPatient = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PatientUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as PatientUser;
  },
);
