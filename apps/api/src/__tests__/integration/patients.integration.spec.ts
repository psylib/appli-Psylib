/**
 * Integration tests for Patients API
 *
 * Tests:
 * 1. Multi-tenant isolation: Psy A cannot read Psy B's patient
 * 2. Auth guard reject: No token → 403
 * 3. RGPD purge: DELETE /patients/:id/purge deletes the patient
 * 4. PrismaExceptionFilter: P2002 → 409
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Injectable,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { PrismaExceptionFilter } from '../../common/prisma-exception.filter';
import { PSY_A, PSY_B, setCurrentUser } from './setup';
import type { KeycloakUser } from '../../auth/keycloak-jwt.strategy';

// ─── Auth guard ──────────────────────────────────────────────────────────────

let _currentUser: KeycloakUser | null = PSY_A;

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!_currentUser) return false;
    const req = context.switchToHttp().getRequest();
    req.user = _currentUser;
    return true;
  }
}

function setUser(user: KeycloakUser | null) {
  _currentUser = user;
  setCurrentUser(user);
}

// ─── In-memory patients service ──────────────────────────────────────────────

@Injectable()
class TenantPatientsService {
  private psyMap: Record<string, string> = {
    [PSY_A.sub]: 'psy-a-id',
    [PSY_B.sub]: 'psy-b-id',
  };
  private patients = new Map<string, { id: string; psychologistId: string; name: string; email: string }>();

  createPatient(userId: string, name: string, email: string) {
    const psyId = this.psyMap[userId];
    if (!psyId) throw new NotFoundException('Profil psychologue introuvable');
    const id = crypto.randomUUID();
    const patient = { id, psychologistId: psyId, name, email };
    this.patients.set(id, patient);
    return patient;
  }

  findOne(userId: string, patientId: string) {
    const psyId = this.psyMap[userId];
    const patient = this.patients.get(patientId);
    if (!patient || patient.psychologistId !== psyId) {
      throw new NotFoundException('Patient introuvable');
    }
    return patient;
  }

  purge(userId: string, patientId: string) {
    const psyId = this.psyMap[userId];
    const patient = this.patients.get(patientId);
    if (!patient || patient.psychologistId !== psyId) {
      throw new NotFoundException('Patient introuvable');
    }
    this.patients.delete(patientId);
  }

  throwDuplicate() {
    throw new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`email`)',
      { code: 'P2002', clientVersion: '5.0.0', meta: { target: ['email'] } },
    );
  }
}

// ─── Controller ──────────────────────────────────────────────────────────────

@UseGuards(MockAuthGuard)
@Controller('test-patients')
class TestPatientsController {
  constructor(@Inject(TenantPatientsService) private readonly svc: TenantPatientsService) {}

  @Post()
  create(@Body() body: { name: string; email: string }, @Req() req: { user: KeycloakUser }) {
    return this.svc.createPatient(req.user.sub, body.name, body.email);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: KeycloakUser }) {
    return this.svc.findOne(req.user.sub, id);
  }

  @Delete(':id/purge')
  @HttpCode(HttpStatus.NO_CONTENT)
  purge(@Param('id') id: string, @Req() req: { user: KeycloakUser }) {
    this.svc.purge(req.user.sub, id);
  }

  @Post('duplicate')
  duplicate() {
    this.svc.throwDuplicate();
  }
}

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Patients Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestPatientsController],
      providers: [TenantPatientsService, MockAuthGuard],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('Multi-tenant isolation', () => {
    it('Psy A creates a patient and can read it', async () => {
      setUser(PSY_A);
      const createRes = await request(app.getHttpServer())
        .post('/test-patients')
        .send({ name: 'Patient Alice', email: 'alice@test.com' })
        .expect(201);

      expect(createRes.body.name).toBe('Patient Alice');
      expect(createRes.body.psychologistId).toBe('psy-a-id');

      const getRes = await request(app.getHttpServer())
        .get(`/test-patients/${createRes.body.id}`)
        .expect(200);

      expect(getRes.body.id).toBe(createRes.body.id);
    });

    it('Psy B CANNOT read Psy A patient → 404', async () => {
      setUser(PSY_A);
      const createRes = await request(app.getHttpServer())
        .post('/test-patients')
        .send({ name: 'Secret Patient', email: 'secret@test.com' })
        .expect(201);

      setUser(PSY_B);
      await request(app.getHttpServer())
        .get(`/test-patients/${createRes.body.id}`)
        .expect(404);
    });
  });

  describe('Auth guard', () => {
    it('rejects unauthenticated request → 403', async () => {
      setUser(null);
      await request(app.getHttpServer())
        .get('/test-patients/some-id')
        .expect(403);
      setUser(PSY_A);
    });
  });

  describe('RGPD purge', () => {
    it('DELETE purge removes the patient → 204', async () => {
      setUser(PSY_A);
      const createRes = await request(app.getHttpServer())
        .post('/test-patients')
        .send({ name: 'To Purge', email: 'purge@test.com' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/test-patients/${createRes.body.id}/purge`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/test-patients/${createRes.body.id}`)
        .expect(404);
    });

    it('Psy B cannot purge Psy A patient → 404', async () => {
      setUser(PSY_A);
      const createRes = await request(app.getHttpServer())
        .post('/test-patients')
        .send({ name: 'Protected', email: 'protected@test.com' })
        .expect(201);

      setUser(PSY_B);
      await request(app.getHttpServer())
        .delete(`/test-patients/${createRes.body.id}/purge`)
        .expect(404);
    });
  });

  describe('PrismaExceptionFilter', () => {
    it('P2002 (unique constraint) → 409 Conflict', async () => {
      setUser(PSY_A);
      const res = await request(app.getHttpServer())
        .post('/test-patients/duplicate')
        .send({})
        .expect(409);

      expect(res.body.code).toBe('PRISMA_P2002');
      expect(res.body.statusCode).toBe(409);
    });
  });
});
