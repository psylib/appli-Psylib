/**
 * Tests d'intégration RÉELS de l'API Patients.
 *
 * Avant : ces tests instanciaient un faux TenantPatientsService + MockAuthGuard
 * + un TestPatientsController — donc une régression d'isolation tenant ou de RBAC
 * ne faisait échouer AUCUN test (audit 2026-06-05, finding H4).
 *
 * Maintenant : on boote le VRAI PatientsController avec les VRAIS
 * RolesGuard + SubscriptionGuard + AuditInterceptor + PrismaExceptionFilter.
 * Seuls le KeycloakGuard (signature JWT) et les services feuilles (Prisma,
 * PatientsService, SubscriptionService...) sont mockés. La logique d'isolation
 * tenant du service est, elle, couverte par patients/__tests__/patients.service.spec.ts.
 *
 * Couvre :
 * 1. RBAC réel : un patient est bloqué des routes psy → 403
 * 2. Subscription gating réel : limite de plan atteinte → 403
 * 3. Propagation 404 (patient d'un autre tenant) via le vrai controller
 * 4. PrismaExceptionFilter : P2002 → 409
 * 5. Auth : requête non authentifiée → 403
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import request from 'supertest';

import { PatientsController } from '../../patients/patients.controller';
import { PatientsService } from '../../patients/patients.service';
import { PatientInvitationService } from '../../patient-portal/patient-invitation.service';
import { SubscriptionService } from '../../billing/subscription.service';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/audit.service';
import { KeycloakGuard } from '../../auth/guards/keycloak.guard';
import { PrismaExceptionFilter } from '../../common/prisma-exception.filter';
import { PSY_A, PSY_B, PATIENT_USER, setCurrentUser, FakeKeycloakGuard } from './setup';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ─── Mocks des services feuilles (la logique réelle est testée unitairement) ──
const patientsService = {
  findAll: vi.fn(),
  create: vi.fn(),
  findOne: vi.fn(),
  findOneAdmin: vi.fn(),
  getStats: vi.fn(),
  update: vi.fn(),
  archive: vi.fn(),
  purge: vi.fn(),
  exportAllCsv: vi.fn(),
  exportPatientRgpd: vi.fn(),
  importPatients: vi.fn(),
  getPatientPortalMood: vi.fn(),
  getPatientPortalExercises: vi.fn(),
  createExercise: vi.fn(),
};

const invitationService = {
  invitePatient: vi.fn(),
  getInvitationStatus: vi.fn(),
};

const subscriptionService = {
  checkPatientLimit: vi.fn(),
  checkSessionLimit: vi.fn(),
  checkAiUsage: vi.fn(),
  checkCourseLimit: vi.fn(),
  checkExpenseLimit: vi.fn(),
  checkDocumentQuota: vi.fn(),
};

const prisma = {
  psychologist: { findUnique: vi.fn() },
};

const auditService = { log: vi.fn(), logRead: vi.fn(), logDecrypt: vi.fn() };

// Psy actif (plan Free) renvoyé par le SubscriptionGuard
function activePsy(userId: string) {
  return {
    id: `${userId}-psyid`,
    userId,
    subscription: { plan: 'free', status: 'active' },
  };
}

describe('Patients API — Integration (réel)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        { provide: PatientsService, useValue: patientsService },
        { provide: PatientInvitationService, useValue: invitationService },
        { provide: SubscriptionService, useValue: subscriptionService },
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    });
    // Seul le KeycloakGuard (vérif signature JWT) est neutralisé ;
    // RolesGuard, SubscriptionGuard, AuditInterceptor et PrismaExceptionFilter
    // sont les vrais.
    builder.overrideGuard(KeycloakGuard).useClass(FakeKeycloakGuard);

    const moduleRef = await builder.compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentUser(PSY_A);
    // Par défaut : psy actif trouvé, limites OK
    prisma.psychologist.findUnique.mockImplementation(({ where }: { where: { userId: string } }) =>
      Promise.resolve(activePsy(where.userId)),
    );
    subscriptionService.checkPatientLimit.mockResolvedValue(undefined);
  });

  // ── 1. RBAC réel ─────────────────────────────────────────────────────────────
  describe('RBAC (RolesGuard réel)', () => {
    it('un patient est bloqué de GET /patients → 403', async () => {
      setCurrentUser(PATIENT_USER);
      await request(app.getHttpServer()).get('/patients').expect(403);
      expect(patientsService.findAll).not.toHaveBeenCalled();
    });

    it('un psychologue accède à GET /patients → 200', async () => {
      patientsService.findAll.mockResolvedValueOnce({ data: [], total: 0, page: 1, totalPages: 0 });
      const res = await request(app.getHttpServer()).get('/patients').expect(200);
      expect(res.body.total).toBe(0);
      expect(patientsService.findAll).toHaveBeenCalledOnce();
    });
  });

  // ── 2. Auth ──────────────────────────────────────────────────────────────────
  describe('Authentification (KeycloakGuard)', () => {
    it('requête non authentifiée → 403', async () => {
      setCurrentUser(null);
      await request(app.getHttpServer()).get('/patients').expect(403);
    });
  });

  // ── 3. Subscription gating réel ──────────────────────────────────────────────
  describe('SubscriptionGuard réel sur POST /patients', () => {
    it('limite de patients atteinte → 403 (checkPatientLimit refuse)', async () => {
      subscriptionService.checkPatientLimit.mockRejectedValueOnce(
        new ForbiddenException('Limite de patients atteinte (plan Free : 15)'),
      );
      await request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'Patient Test' })
        .expect(403);
      // Le guard a bloqué avant d'atteindre le service
      expect(patientsService.create).not.toHaveBeenCalled();
    });

    it('limite OK → le patient est créé → 201', async () => {
      patientsService.create.mockResolvedValueOnce({ id: VALID_UUID, name: 'Patient Test' });
      const res = await request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'Patient Test' })
        .expect(201);
      expect(res.body.name).toBe('Patient Test');
      expect(subscriptionService.checkPatientLimit).toHaveBeenCalledOnce();
    });
  });

  // ── 4. Validation ────────────────────────────────────────────────────────────
  describe('ValidationPipe', () => {
    it('nom trop court → 400', async () => {
      await request(app.getHttpServer()).post('/patients').send({ name: 'a' }).expect(400);
    });

    it('champ inconnu (forbidNonWhitelisted) → 400', async () => {
      await request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'Patient Test', hacked: true })
        .expect(400);
    });

    it('UUID invalide sur GET /patients/:id → 400 (ParseUUIDPipe)', async () => {
      await request(app.getHttpServer()).get('/patients/not-a-uuid').expect(400);
    });
  });

  // ── 5. Propagation 404 (isolation tenant côté service) ───────────────────────
  describe('Isolation tenant (propagation depuis le service)', () => {
    it('patient introuvable / appartenant à un autre psy → 404', async () => {
      // PSY_B tente d'accéder à un patient de PSY_A : le service réel filtre par
      // tenant et lève NotFound (cf. patients.service.spec.ts) ; ici on vérifie
      // que le controller propage bien le 404.
      setCurrentUser(PSY_B);
      patientsService.findOne.mockRejectedValueOnce(new NotFoundException('Patient introuvable'));
      await request(app.getHttpServer()).get(`/patients/${VALID_UUID}`).expect(404);
      expect(patientsService.findOne).toHaveBeenCalledWith(PSY_B.sub, VALID_UUID, PSY_B.sub, expect.anything());
    });
  });

  // ── 6. PrismaExceptionFilter ─────────────────────────────────────────────────
  describe('PrismaExceptionFilter', () => {
    it('P2002 (contrainte unique) levé par le service → 409', async () => {
      patientsService.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed on the fields: (`email`)',
          { code: 'P2002', clientVersion: '5.0.0', meta: { target: ['email'] } },
        ),
      );
      const res = await request(app.getHttpServer())
        .post('/patients')
        .send({ name: 'Patient Test' })
        .expect(409);
      expect(res.body.code).toBe('PRISMA_P2002');
      expect(res.body.statusCode).toBe(409);
    });
  });
});
