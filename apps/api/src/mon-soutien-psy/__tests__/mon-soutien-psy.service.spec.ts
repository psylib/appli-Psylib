import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonSoutienPsyService } from '../mon-soutien-psy.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  monSoutienPsyTracking: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  psychologist: {
    findUnique: vi.fn(),
  },
};

const mockNotifications = {
  createNotification: vi.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PSY_ID = 'psy-db-uuid';
const PSY_USER_ID = 'psy-user-uuid';
const PATIENT_ID = 'patient-uuid';
const YEAR = new Date().getFullYear();

const basePsy = { id: PSY_ID, userId: PSY_USER_ID, name: 'Dr. Test' };

function makeTracking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tracking-uuid',
    psychologistId: PSY_ID,
    patientId: PATIENT_ID,
    year: YEAR,
    sessionsUsed: 1,
    maxSessions: 12,
    firstSessionAt: new Date(),
    lastSessionAt: new Date(),
    patient: { name: 'Jean Dupont' },
    ...overrides,
  };
}

// ─── Service factory ──────────────────────────────────────────────────────────
function createService(): MonSoutienPsyService {
  return new MonSoutienPsyService(
    mockPrisma as never,
    mockNotifications as never,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('MonSoutienPsyService', () => {
  let service: MonSoutienPsyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // ── incrementSessionCount() ─────────────────────────────────────────────────
  describe('incrementSessionCount()', () => {
    it('should upsert and increment sessionsUsed', async () => {
      const tracking = makeTracking({ sessionsUsed: 3 });
      mockPrisma.monSoutienPsyTracking.upsert.mockResolvedValueOnce(tracking);
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(basePsy);

      const result = await service.incrementSessionCount(PSY_ID, PATIENT_ID);

      expect(result).toEqual(tracking);
      expect(mockPrisma.monSoutienPsyTracking.upsert).toHaveBeenCalledOnce();

      const call = mockPrisma.monSoutienPsyTracking.upsert.mock.calls[0]![0];
      expect(call.where.psychologistId_patientId_year).toEqual({
        psychologistId: PSY_ID,
        patientId: PATIENT_ID,
        year: YEAR,
      });
      expect(call.create.psychologistId).toBe(PSY_ID);
      expect(call.create.patientId).toBe(PATIENT_ID);
      expect(call.create.sessionsUsed).toBe(1);
      expect(call.update.sessionsUsed).toEqual({ increment: 1 });
    });

    it('should NOT send notification when sessionsUsed < 10', async () => {
      const tracking = makeTracking({ sessionsUsed: 5 });
      mockPrisma.monSoutienPsyTracking.upsert.mockResolvedValueOnce(tracking);
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(basePsy);

      await service.incrementSessionCount(PSY_ID, PATIENT_ID);

      expect(mockNotifications.createNotification).not.toHaveBeenCalled();
    });

    it('should send msp_near_quota notification when sessionsUsed reaches 10', async () => {
      const tracking = makeTracking({ sessionsUsed: 10 });
      mockPrisma.monSoutienPsyTracking.upsert.mockResolvedValueOnce(tracking);
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(basePsy);

      await service.incrementSessionCount(PSY_ID, PATIENT_ID);

      expect(mockNotifications.createNotification).toHaveBeenCalledOnce();
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        PSY_USER_ID,
        'msp_near_quota',
        'Quota Mon Soutien Psy bientôt atteint',
        expect.stringContaining('10/12'),
      );
    });

    it('should send msp_near_quota notification when sessionsUsed is 11', async () => {
      const tracking = makeTracking({ sessionsUsed: 11 });
      mockPrisma.monSoutienPsyTracking.upsert.mockResolvedValueOnce(tracking);
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(basePsy);

      await service.incrementSessionCount(PSY_ID, PATIENT_ID);

      expect(mockNotifications.createNotification).toHaveBeenCalledOnce();
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        PSY_USER_ID,
        'msp_near_quota',
        'Quota Mon Soutien Psy bientôt atteint',
        expect.stringContaining('11/12'),
      );
    });

    it('should send msp_quota_reached notification when sessionsUsed reaches 12', async () => {
      const tracking = makeTracking({ sessionsUsed: 12 });
      mockPrisma.monSoutienPsyTracking.upsert.mockResolvedValueOnce(tracking);
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(basePsy);

      await service.incrementSessionCount(PSY_ID, PATIENT_ID);

      expect(mockNotifications.createNotification).toHaveBeenCalledOnce();
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        PSY_USER_ID,
        'msp_quota_reached',
        'Quota Mon Soutien Psy atteint',
        expect.stringContaining('12/12'),
      );
    });

    it('should send msp_quota_reached when sessionsUsed exceeds 12', async () => {
      const tracking = makeTracking({ sessionsUsed: 14 });
      mockPrisma.monSoutienPsyTracking.upsert.mockResolvedValueOnce(tracking);
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(basePsy);

      await service.incrementSessionCount(PSY_ID, PATIENT_ID);

      expect(mockNotifications.createNotification).toHaveBeenCalledOnce();
      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        PSY_USER_ID,
        'msp_quota_reached',
        'Quota Mon Soutien Psy atteint',
        expect.stringContaining('14/12'),
      );
    });

    it('should not send notification if psychologist not found', async () => {
      const tracking = makeTracking({ sessionsUsed: 12 });
      mockPrisma.monSoutienPsyTracking.upsert.mockResolvedValueOnce(tracking);
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(null);

      await service.incrementSessionCount(PSY_ID, PATIENT_ID);

      expect(mockNotifications.createNotification).not.toHaveBeenCalled();
    });
  });

  // ── decrementSessionCount() ─────────────────────────────────────────────────
  describe('decrementSessionCount()', () => {
    it('should decrement sessionsUsed when tracking exists', async () => {
      const tracking = makeTracking({ sessionsUsed: 5 });
      mockPrisma.monSoutienPsyTracking.findUnique.mockResolvedValueOnce(tracking);
      mockPrisma.monSoutienPsyTracking.update.mockResolvedValueOnce({
        ...tracking,
        sessionsUsed: 4,
      });

      const result = await service.decrementSessionCount(PSY_ID, PATIENT_ID);

      expect(result!.sessionsUsed).toBe(4);
      expect(mockPrisma.monSoutienPsyTracking.update).toHaveBeenCalledOnce();
      const updateCall = mockPrisma.monSoutienPsyTracking.update.mock.calls[0]![0];
      expect(updateCall.data.sessionsUsed).toEqual({ decrement: 1 });
    });

    it('should return tracking unchanged when sessionsUsed is 0', async () => {
      const tracking = makeTracking({ sessionsUsed: 0 });
      mockPrisma.monSoutienPsyTracking.findUnique.mockResolvedValueOnce(tracking);

      const result = await service.decrementSessionCount(PSY_ID, PATIENT_ID);

      expect(result).toEqual(tracking);
      expect(mockPrisma.monSoutienPsyTracking.update).not.toHaveBeenCalled();
    });

    it('should return null when no tracking exists', async () => {
      mockPrisma.monSoutienPsyTracking.findUnique.mockResolvedValueOnce(null);

      const result = await service.decrementSessionCount(PSY_ID, PATIENT_ID);

      expect(result).toBeNull();
      expect(mockPrisma.monSoutienPsyTracking.update).not.toHaveBeenCalled();
    });
  });

  // ── getPatientTracking() ────────────────────────────────────────────────────
  describe('getPatientTracking()', () => {
    it('should return tracking for current year', async () => {
      const tracking = makeTracking();
      mockPrisma.monSoutienPsyTracking.findUnique.mockResolvedValueOnce(tracking);

      const result = await service.getPatientTracking(PSY_ID, PATIENT_ID);

      expect(result).toEqual(tracking);
      const call = mockPrisma.monSoutienPsyTracking.findUnique.mock.calls[0]![0];
      expect(call.where.psychologistId_patientId_year).toEqual({
        psychologistId: PSY_ID,
        patientId: PATIENT_ID,
        year: YEAR,
      });
    });

    it('should return null when no tracking exists', async () => {
      mockPrisma.monSoutienPsyTracking.findUnique.mockResolvedValueOnce(null);

      const result = await service.getPatientTracking(PSY_ID, PATIENT_ID);

      expect(result).toBeNull();
    });
  });

  // ── getOverview() ───────────────────────────────────────────────────────────
  describe('getOverview()', () => {
    it('should return all MSP patients for current year', async () => {
      const trackings = [
        makeTracking({ sessionsUsed: 10, patient: { name: 'Jean Dupont', email: 'jean@test.fr' } }),
        makeTracking({ patientId: 'other-patient', sessionsUsed: 3, patient: { name: 'Marie Curie', email: 'marie@test.fr' } }),
      ];
      mockPrisma.monSoutienPsyTracking.findMany.mockResolvedValueOnce(trackings);

      const result = await service.getOverview(PSY_ID);

      expect(result).toHaveLength(2);
      const call = mockPrisma.monSoutienPsyTracking.findMany.mock.calls[0]![0];
      expect(call.where.psychologistId).toBe(PSY_ID);
      expect(call.where.year).toBe(YEAR);
      expect(call.include.patient.select).toEqual({ name: true, email: true });
      expect(call.orderBy.sessionsUsed).toBe('desc');
    });

    it('should return empty array when no trackings exist', async () => {
      mockPrisma.monSoutienPsyTracking.findMany.mockResolvedValueOnce([]);

      const result = await service.getOverview(PSY_ID);

      expect(result).toEqual([]);
    });
  });

  // ── getPatientHistory() ─────────────────────────────────────────────────────
  describe('getPatientHistory()', () => {
    it('should return all years tracking for a patient', async () => {
      const trackings = [
        makeTracking({ year: YEAR, sessionsUsed: 8 }),
        makeTracking({ year: YEAR - 1, sessionsUsed: 12 }),
      ];
      mockPrisma.monSoutienPsyTracking.findMany.mockResolvedValueOnce(trackings);

      const result = await service.getPatientHistory(PSY_ID, PATIENT_ID);

      expect(result).toHaveLength(2);
      const call = mockPrisma.monSoutienPsyTracking.findMany.mock.calls[0]![0];
      expect(call.where.psychologistId).toBe(PSY_ID);
      expect(call.where.patientId).toBe(PATIENT_ID);
      expect(call.orderBy.year).toBe('desc');
    });
  });

  // ── isQuotaReached() ────────────────────────────────────────────────────────
  describe('isQuotaReached()', () => {
    it('should return true when sessionsUsed >= maxSessions', () => {
      expect(service.isQuotaReached({ sessionsUsed: 12, maxSessions: 12 })).toBe(true);
      expect(service.isQuotaReached({ sessionsUsed: 15, maxSessions: 12 })).toBe(true);
    });

    it('should return false when sessionsUsed < maxSessions', () => {
      expect(service.isQuotaReached({ sessionsUsed: 11, maxSessions: 12 })).toBe(false);
      expect(service.isQuotaReached({ sessionsUsed: 0, maxSessions: 12 })).toBe(false);
    });

    it('should return false when tracking is null', () => {
      expect(service.isQuotaReached(null)).toBe(false);
    });
  });

  // ── isNearQuota() ───────────────────────────────────────────────────────────
  describe('isNearQuota()', () => {
    it('should return true when sessionsUsed >= 10', () => {
      expect(service.isNearQuota({ sessionsUsed: 10, maxSessions: 12 })).toBe(true);
      expect(service.isNearQuota({ sessionsUsed: 11, maxSessions: 12 })).toBe(true);
      expect(service.isNearQuota({ sessionsUsed: 12, maxSessions: 12 })).toBe(true);
    });

    it('should return false when sessionsUsed < 10', () => {
      expect(service.isNearQuota({ sessionsUsed: 9, maxSessions: 12 })).toBe(false);
      expect(service.isNearQuota({ sessionsUsed: 0, maxSessions: 12 })).toBe(false);
    });

    it('should return false when tracking is null', () => {
      expect(service.isNearQuota(null)).toBe(false);
    });
  });
});
