import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles decorator — Définit les rôles requis pour une route
 *
 * Utilisation :
 * @UseGuards(KeycloakGuard, RolesGuard)
 * @Roles('psychologist')
 * @Get('patients')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
