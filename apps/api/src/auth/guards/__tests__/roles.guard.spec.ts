/**
 * Tests RÉELS du RolesGuard.
 *
 * Contrairement aux anciens MockRolesGuard (rôles codés en dur), ces tests
 * exercent la vraie classe RolesGuard + un vrai Reflector lisant la vraie
 * métadonnée posée par le décorateur @Roles. Une régression RBAC (lecture
 * de métadonnée, comparaison role/roles[]) fait désormais échouer un test.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import type { KeycloakUser } from '../../keycloak-jwt.strategy';

// Contrôleur d'exemple décoré avec le VRAI décorateur @Roles ─ la métadonnée
// est lue par le vrai Reflector exactement comme en production.
class SampleController {
  @Roles('psychologist', 'admin')
  psyOrAdmin() {}

  @Roles('admin')
  adminOnly() {}

  noRoles() {}
}

const proto = SampleController.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;

function makeContext(
  handler: (...a: unknown[]) => unknown,
  user: Partial<KeycloakUser> | null,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => SampleController,
    switchToHttp: () => ({ getRequest: () => ({ user: user ?? undefined }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard (réel)', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
  });

  it('autorise une route sans @Roles (aucun rôle requis)', () => {
    const ctx = makeContext(proto.noRoles, { role: 'patient', roles: ['patient'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('autorise un psychologue via user.role sur @Roles(psychologist, admin)', () => {
    const ctx = makeContext(proto.psyOrAdmin, { role: 'psychologist', roles: [] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('autorise via le tableau roles[] même si user.role ne correspond pas', () => {
    const ctx = makeContext(proto.psyOrAdmin, { role: 'patient', roles: ['admin'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('refuse un patient sur une route psychologist/admin → ForbiddenException', () => {
    const ctx = makeContext(proto.psyOrAdmin, { role: 'patient', roles: ['patient'] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuse un psychologue sur une route admin-only → ForbiddenException', () => {
    const ctx = makeContext(proto.adminOnly, { role: 'psychologist', roles: ['psychologist'] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuse une requête non authentifiée (pas de user) → ForbiddenException', () => {
    const ctx = makeContext(proto.psyOrAdmin, null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
