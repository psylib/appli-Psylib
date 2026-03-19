import { vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SessionsService } from '../sessions.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  session: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  psychologist: { findUnique: vi.fn() },
  patient: { findFirst: vi.fn() },
  auditLog: { create: vi.fn() },
};

const mockEncryption = {
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
  decrypt: vi.fn((text: string) => text.replace('encrypted:', '')),
};

const mockAudit = {
  log: vi.fn(),
  logRead: vi.fn(),
  logDecrypt: vi.fn(),
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PSY_USER_ID = 'user-psy-001';
const PSY_ID = 'psy-001';
const PATIENT_ID = 'patient-001';
const SESSION_ID = 'session-001';
const ACTOR_ID = PSY_USER_ID;

const fakePsy = { id: PSY_ID, userId: PSY_USER_ID };
const fakePatient = { id: PATIENT_ID, psychologistId: PSY_ID };
const fakeSession = {
  id: SESSION_ID,
  patientId: PATIENT_ID,
  psychologistId: PSY_ID,
  date: new Date('2026-03-15T14:00:00Z'),
  duration: 50,
  type: 'individual',
  notes: null,
  summaryAi: null,
  tags: [],
  rate: 80,
  paymentStatus: 'pending',
  createdAt: new Date(),
  orientation: null,
  templateId: null,
};

// ---------------------------------------------------------------------------
// Helper to build the service with mocks
// ---------------------------------------------------------------------------

function createService(): SessionsService {
  return new SessionsService(
    mockPrisma as any,
    mockEncryption as any,
    mockAudit as any,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
    // Default: psy found
    mockPrisma.psychologist.findUnique.mockResolvedValue(fakePsy);
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------

  describe('create()', () => {
    const createDto = {
      patientId: PATIENT_ID,
      date: '2026-03-15T14:00:00Z',
      duration: 50,
    };

    it('crée une session avec les champs de base', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(fakePatient);
      mockPrisma.session.create.mockResolvedValue(fakeSession);

      const result = await service.create(PSY_USER_ID, createDto as any, ACTOR_ID);

      expect(mockPrisma.session.create).toHaveBeenCalledOnce();
      const callData = mockPrisma.session.create.mock.calls[0]![0].data;
      expect(callData.patientId).toBe(PATIENT_ID);
      expect(callData.psychologistId).toBe(PSY_ID);
      expect(callData.duration).toBe(50);
      expect(callData.paymentStatus).toBe('pending');
      expect(result).toEqual(fakeSession);
    });

    it('chiffre le champ notes si fourni', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(fakePatient);
      mockPrisma.session.create.mockResolvedValue({ ...fakeSession, notes: 'encrypted:notes confidentielles' });

      await service.create(
        PSY_USER_ID,
        { ...createDto, notes: 'notes confidentielles' } as any,
        ACTOR_ID,
      );

      expect(mockEncryption.encrypt).toHaveBeenCalledWith('notes confidentielles');
      const callData = mockPrisma.session.create.mock.calls[0]![0].data;
      expect(callData.notes).toBe('encrypted:notes confidentielles');
    });

    it('lève NotFoundException si le patient n\'appartient pas au psy (tenant isolation)', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PSY_USER_ID, createDto as any, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('enregistre un audit CREATE', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(fakePatient);
      mockPrisma.session.create.mockResolvedValue(fakeSession);

      await service.create(PSY_USER_ID, createDto as any, ACTOR_ID);

      expect(mockAudit.log).toHaveBeenCalledOnce();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: ACTOR_ID,
          actorType: 'psychologist',
          action: 'CREATE',
          entityType: 'session',
          entityId: SESSION_ID,
        }),
      );
    });

    it('lève ForbiddenException si le profil psy est introuvable', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValue(null);

      await expect(
        service.create(PSY_USER_ID, createDto as any, ACTOR_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // findAll()
  // -------------------------------------------------------------------------

  describe('findAll()', () => {
    const query = { page: 1, limit: 20 };

    const listSessions = [
      {
        id: SESSION_ID,
        patientId: PATIENT_ID,
        psychologistId: PSY_ID,
        date: new Date(),
        duration: 50,
        type: 'individual',
        tags: [],
        rate: 80,
        paymentStatus: 'pending',
        createdAt: new Date(),
        patient: { name: 'Alice', status: 'active' },
      },
    ];

    it('filtre toujours par psychologistId', async () => {
      mockPrisma.session.findMany.mockResolvedValue(listSessions);
      mockPrisma.session.count.mockResolvedValue(1);

      await service.findAll(PSY_USER_ID, query as any, ACTOR_ID);

      const whereArg = mockPrisma.session.findMany.mock.calls[0]![0].where;
      expect(whereArg.psychologistId).toBe(PSY_ID);
    });

    it('retourne la pagination correctement', async () => {
      mockPrisma.session.findMany.mockResolvedValue(listSessions);
      mockPrisma.session.count.mockResolvedValue(42);

      const result = await service.findAll(PSY_USER_ID, { page: 2, limit: 10 } as any, ACTOR_ID);

      expect(result.total).toBe(42);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
    });

    it('filtre par dateRange (from/to) si fourni', async () => {
      mockPrisma.session.findMany.mockResolvedValue(listSessions);
      mockPrisma.session.count.mockResolvedValue(1);

      await service.findAll(
        PSY_USER_ID,
        { from: '2026-03-01', to: '2026-03-31' } as any,
        ACTOR_ID,
      );

      const whereArg = mockPrisma.session.findMany.mock.calls[0]![0].where;
      expect(whereArg.date).toBeDefined();
      expect(whereArg.date.gte).toBeInstanceOf(Date);
      expect(whereArg.date.lte).toBeInstanceOf(Date);
    });

    it('ne retourne JAMAIS notes ni summaryAi dans la liste (select false)', async () => {
      mockPrisma.session.findMany.mockResolvedValue(listSessions);
      mockPrisma.session.count.mockResolvedValue(1);

      await service.findAll(PSY_USER_ID, query as any, ACTOR_ID);

      const selectArg = mockPrisma.session.findMany.mock.calls[0]![0].select;
      expect(selectArg.notes).toBe(false);
      expect(selectArg.summaryAi).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // findOne()
  // -------------------------------------------------------------------------

  describe('findOne()', () => {
    it('retourne la session avec notes et summaryAi déchiffrés', async () => {
      const sessionWithEncrypted = {
        ...fakeSession,
        notes: 'encrypted:notes secrètes',
        summaryAi: 'encrypted:résumé IA',
      };
      mockPrisma.session.findFirst.mockResolvedValue(sessionWithEncrypted);

      const result = await service.findOne(PSY_USER_ID, SESSION_ID, ACTOR_ID);

      expect(mockEncryption.decrypt).toHaveBeenCalledWith('encrypted:notes secrètes');
      expect(mockEncryption.decrypt).toHaveBeenCalledWith('encrypted:résumé IA');
      expect(result.notes).toBe('notes secrètes');
      expect(result.summaryAi).toBe('résumé IA');
    });

    it('enregistre 2 audits DECRYPT (notes + summaryAi)', async () => {
      const sessionWithEncrypted = {
        ...fakeSession,
        notes: 'encrypted:notes',
        summaryAi: 'encrypted:summary',
      };
      mockPrisma.session.findFirst.mockResolvedValue(sessionWithEncrypted);

      await service.findOne(PSY_USER_ID, SESSION_ID, ACTOR_ID);

      expect(mockAudit.logDecrypt).toHaveBeenCalledTimes(2);
      expect(mockAudit.logDecrypt).toHaveBeenCalledWith(
        ACTOR_ID, 'psychologist', 'session', SESSION_ID, 'notes', undefined,
      );
      expect(mockAudit.logDecrypt).toHaveBeenCalledWith(
        ACTOR_ID, 'psychologist', 'session', SESSION_ID, 'summary_ai', undefined,
      );
    });

    it('lève NotFoundException si la session est inexistante', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(PSY_USER_ID, SESSION_ID, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si la session appartient à un autre psy', async () => {
      // findFirst avec le filtre psychologistId retourne null pour un autre psy
      mockPrisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(PSY_USER_ID, 'session-autre-psy', ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('ne déchiffre pas si notes est null', async () => {
      mockPrisma.session.findFirst.mockResolvedValue({ ...fakeSession, notes: null, summaryAi: null });

      const result = await service.findOne(PSY_USER_ID, SESSION_ID, ACTOR_ID);

      expect(mockEncryption.decrypt).not.toHaveBeenCalled();
      expect(result.notes).toBeNull();
      expect(result.summaryAi).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------------

  describe('update()', () => {
    it('met à jour les champs fournis', async () => {
      const updatedSession = { ...fakeSession, duration: 60, paymentStatus: 'paid' };
      mockPrisma.session.findFirst.mockResolvedValue(fakeSession);
      mockPrisma.session.update.mockResolvedValue(updatedSession);

      const result = await service.update(
        PSY_USER_ID,
        SESSION_ID,
        { duration: 60, paymentStatus: 'paid' as any },
        ACTOR_ID,
      );

      expect(mockPrisma.session.update).toHaveBeenCalledOnce();
      const updateData = mockPrisma.session.update.mock.calls[0]![0].data;
      expect(updateData.duration).toBe(60);
      expect(updateData.paymentStatus).toBe('paid');
      expect(result).toEqual(updatedSession);
    });

    it('chiffre les notes si modifiées', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(fakeSession);
      mockPrisma.session.update.mockResolvedValue(fakeSession);

      await service.update(
        PSY_USER_ID,
        SESSION_ID,
        { notes: 'nouvelles notes' } as any,
        ACTOR_ID,
      );

      expect(mockEncryption.encrypt).toHaveBeenCalledWith('nouvelles notes');
      const updateData = mockPrisma.session.update.mock.calls[0]![0].data;
      expect(updateData.notes).toBe('encrypted:nouvelles notes');
    });

    it('enregistre un audit UPDATE', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(fakeSession);
      mockPrisma.session.update.mockResolvedValue(fakeSession);

      await service.update(
        PSY_USER_ID,
        SESSION_ID,
        { duration: 60 } as any,
        ACTOR_ID,
      );

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: ACTOR_ID,
          action: 'UPDATE',
          entityType: 'session',
          entityId: SESSION_ID,
        }),
      );
    });

    it('lève NotFoundException si la session est introuvable', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PSY_USER_ID, 'session-inexistante', { duration: 60 } as any, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // autosaveNotes()
  // -------------------------------------------------------------------------

  describe('autosaveNotes()', () => {
    it('met à jour uniquement le champ notes', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(fakeSession);
      mockPrisma.session.update.mockResolvedValue(fakeSession);

      await service.autosaveNotes(PSY_USER_ID, SESSION_ID, 'brouillon notes', ACTOR_ID);

      const updateData = mockPrisma.session.update.mock.calls[0]![0].data;
      expect(Object.keys(updateData)).toEqual(['notes']);
    });

    it('chiffre les notes lors de l\'autosave', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(fakeSession);
      mockPrisma.session.update.mockResolvedValue(fakeSession);

      await service.autosaveNotes(PSY_USER_ID, SESSION_ID, 'notes brouillon', ACTOR_ID);

      expect(mockEncryption.encrypt).toHaveBeenCalledWith('notes brouillon');
      const updateData = mockPrisma.session.update.mock.calls[0]![0].data;
      expect(updateData.notes).toBe('encrypted:notes brouillon');
    });

    it('retourne { saved: true, at: string }', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(fakeSession);
      mockPrisma.session.update.mockResolvedValue(fakeSession);

      const result = await service.autosaveNotes(PSY_USER_ID, SESSION_ID, 'notes', ACTOR_ID);

      expect(result.saved).toBe(true);
      expect(typeof result.at).toBe('string');
    });

    it('lève NotFoundException si la session n\'appartient pas au psy', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.autosaveNotes(PSY_USER_ID, 'session-autre-psy', 'notes', ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // getMonthlyStats()
  // -------------------------------------------------------------------------

  describe('getMonthlyStats()', () => {
    it('retourne les stats filtrées par psychologistId', async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);

      await service.getMonthlyStats(PSY_USER_ID);

      // findMany est appelé 2 fois (ce mois + mois dernier), les deux filtrent par psychologistId
      const calls = mockPrisma.session.findMany.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0]![0].where.psychologistId).toBe(PSY_ID);
      expect(calls[1]![0].where.psychologistId).toBe(PSY_ID);
    });

    it('calcule le revenu uniquement sur les sessions payées', async () => {
      const sessions = [
        { rate: 80, paymentStatus: 'paid' },
        { rate: 80, paymentStatus: 'pending' }, // ne doit pas compter
        { rate: 60, paymentStatus: 'paid' },
        { rate: null, paymentStatus: 'paid' }, // rate null → 0
      ];
      // Ce mois = sessions payées, mois dernier = vide
      mockPrisma.session.findMany
        .mockResolvedValueOnce(sessions)
        .mockResolvedValueOnce([]);

      const stats = await service.getMonthlyStats(PSY_USER_ID);

      expect(stats.revenueThisMonth).toBe(140); // 80 + 60 (les deux paid), null → 0
      expect(stats.revenueLastMonth).toBe(0);
      expect(stats.totalThisMonth).toBe(4);
      expect(stats.totalLastMonth).toBe(0);
    });
  });
});
