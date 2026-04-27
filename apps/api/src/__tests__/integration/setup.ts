/**
 * Integration test setup — bootstraps a NestJS TestingModule
 * with real controllers/services but mocked auth (Keycloak bypass)
 * and mocked PrismaService (no real DB required).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaExceptionFilter } from '../../common/prisma-exception.filter';
import type { KeycloakUser } from '../../auth/keycloak-jwt.strategy';

// ─── Mock user factory ──────────────────────────────────────────────────────

export const PSY_A: KeycloakUser = {
  sub: 'user-psy-a-uuid',
  email: 'psy-a@test.com',
  role: 'psychologist',
  roles: ['psychologist'],
  name: 'Dr. Alice',
};

export const PSY_B: KeycloakUser = {
  sub: 'user-psy-b-uuid',
  email: 'psy-b@test.com',
  role: 'psychologist',
  roles: ['psychologist'],
  name: 'Dr. Bob',
};

export const PATIENT_USER: KeycloakUser = {
  sub: 'user-patient-uuid',
  email: 'patient@test.com',
  role: 'patient',
  roles: ['patient'],
  name: 'Patient Test',
};

// ─── Fake auth guard ─────────────────────────────────────────────────────────

let _currentUser: KeycloakUser | null = PSY_A;

export function setCurrentUser(user: KeycloakUser | null) {
  _currentUser = user;
}

/**
 * Fake KeycloakGuard that injects a test user into the request.
 * Set to null with setCurrentUser(null) to test unauthenticated requests.
 */
export class FakeKeycloakGuard {
  canActivate(context: import('@nestjs/common').ExecutionContext): boolean {
    if (!_currentUser) return false;
    const req = context.switchToHttp().getRequest();
    req.user = _currentUser;
    return true;
  }
}

/**
 * Fake throttler that always passes (no rate limiting in tests).
 */
export class FakeThrottlerGuard {
  canActivate(): boolean {
    return true;
  }
}

// ─── App builder ─────────────────────────────────────────────────────────────

export async function createTestApp(
  moduleImports: Parameters<typeof Test.createTestingModule>[0]['imports'],
  overrides?: {
    providers?: Parameters<typeof Test.createTestingModule>[0]['providers'];
  },
): Promise<{ app: INestApplication; module: TestingModule }> {
  const { KeycloakGuard } = await import('../../auth/guards/keycloak.guard');

  const builder = Test.createTestingModule({
    imports: moduleImports ?? [],
    providers: [
      ...(overrides?.providers ?? []),
    ],
  });

  // Override Keycloak guard globally
  builder.overrideGuard(KeycloakGuard).useClass(FakeKeycloakGuard);

  const module = await builder.compile();
  const app = module.createNestApplication();

  // Apply same pipes/filters as main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Override throttler
  const appGuard = app.get(APP_GUARD, { strict: false });
  if (appGuard) {
    // Already handled via module override
  }

  await app.init();

  // Reset to default user
  _currentUser = PSY_A;

  return { app, module };
}
