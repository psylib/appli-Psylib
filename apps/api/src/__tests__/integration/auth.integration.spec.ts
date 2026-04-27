/**
 * Integration tests for Auth guards and input validation
 *
 * Tests:
 * - Unauthenticated requests → 403
 * - Roles guard: patient blocked from psy-only endpoints
 * - ValidationPipe: invalid input → 400
 * - ParseUUIDPipe: non-UUID → 400
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IsString, MinLength, MaxLength } from 'class-validator';
import request from 'supertest';
import { PSY_A, PATIENT_USER, setCurrentUser } from './setup';
import type { KeycloakUser } from '../../auth/keycloak-jwt.strategy';

// ─── Auth guard ──────────────────────────────────────────────────────────────

let _user: KeycloakUser | null = PSY_A;

function setUser(u: KeycloakUser | null) {
  _user = u;
  setCurrentUser(u);
}

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!_user) return false;
    const req = context.switchToHttp().getRequest();
    req.user = _user;
    return true;
  }
}

// ─── Roles guard ─────────────────────────────────────────────────────────────

@Injectable()
class MockRolesGuard implements CanActivate {
  private requiredRoles: string[];

  constructor() {
    this.requiredRoles = ['psychologist'];
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest() as { user?: KeycloakUser };
    const user = req.user;
    if (!user) throw new ForbiddenException('Non authentifié');

    const hasRole = user.roles.some((r) => this.requiredRoles.includes(r));
    if (!hasRole) throw new ForbiddenException('Rôle insuffisant');
    return true;
  }
}

// ─── Validation DTO ──────────────────────────────────────────────────────────

class CreateItemDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}

// ─── Controller ──────────────────────────────────────────────────────────────

@UseGuards(MockAuthGuard, MockRolesGuard)
@Controller('test-auth')
class TestAuthController {
  @Get('psy-only')
  psyOnly() {
    return { message: 'Psy access granted' };
  }

  @Post('validated')
  createValidated(@Body() dto: CreateItemDto) {
    return { created: dto.name };
  }

  @Get('by-uuid/:id')
  byUuid(@Param('id', ParseUUIDPipe) id: string) {
    return { id };
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Auth & Validation Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestAuthController],
      providers: [MockAuthGuard, MockRolesGuard],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('Authentication', () => {
    it('rejects unauthenticated request → 403', async () => {
      setUser(null);
      await request(app.getHttpServer())
        .get('/test-auth/psy-only')
        .expect(403);
      setUser(PSY_A);
    });

    it('allows authenticated psychologist', async () => {
      setUser(PSY_A);
      const res = await request(app.getHttpServer())
        .get('/test-auth/psy-only')
        .expect(200);
      expect(res.body.message).toBe('Psy access granted');
    });
  });

  describe('Roles guard', () => {
    it('patient role blocked from psy-only endpoint → 403', async () => {
      setUser(PATIENT_USER);
      const res = await request(app.getHttpServer())
        .get('/test-auth/psy-only')
        .expect(403);
      expect(res.body.message).toContain('Rôle insuffisant');
      setUser(PSY_A);
    });
  });

  describe('ValidationPipe', () => {
    it('rejects missing required fields → 400', async () => {
      setUser(PSY_A);
      await request(app.getHttpServer())
        .post('/test-auth/validated')
        .send({})
        .expect(400);
    });

    it('rejects too short name → 400', async () => {
      setUser(PSY_A);
      await request(app.getHttpServer())
        .post('/test-auth/validated')
        .send({ name: 'a' })
        .expect(400);
    });

    it('rejects unknown fields (forbidNonWhitelisted) → 400', async () => {
      setUser(PSY_A);
      await request(app.getHttpServer())
        .post('/test-auth/validated')
        .send({ name: 'Valid Name', hacked: true })
        .expect(400);
    });

    it('accepts valid input → 201', async () => {
      setUser(PSY_A);
      const res = await request(app.getHttpServer())
        .post('/test-auth/validated')
        .send({ name: 'Valid Name' })
        .expect(201);
      expect(res.body.created).toBe('Valid Name');
    });
  });

  describe('ParseUUIDPipe', () => {
    it('rejects non-UUID param → 400', async () => {
      setUser(PSY_A);
      await request(app.getHttpServer())
        .get('/test-auth/by-uuid/not-a-uuid')
        .expect(400);
    });

    it('accepts valid UUID param → 200', async () => {
      setUser(PSY_A);
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const res = await request(app.getHttpServer())
        .get(`/test-auth/by-uuid/${uuid}`)
        .expect(200);
      expect(res.body.id).toBe(uuid);
    });
  });
});
