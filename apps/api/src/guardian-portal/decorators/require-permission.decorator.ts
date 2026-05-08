import { SetMetadata } from '@nestjs/common';
import type { GuardianPermissions } from '@psyscale/shared-types';
import { GUARDIAN_PERMISSION_KEY } from '../guards/guardian-access.guard';

/**
 * Sets the required guardian permission for a route.
 * Used with GuardianAccessGuard.
 */
export const RequirePermission = (permission: keyof GuardianPermissions) =>
  SetMetadata(GUARDIAN_PERMISSION_KEY, permission);
