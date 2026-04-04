import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConsultationTypesService } from '../consultation-types.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  psychologist: {
    findUnique: vi.fn(),
  },
  consultationType: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
};

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makePsy(overrides = {}) {
  return {
    id: 'psy-1',
    userId: 'user-1',
    name: 'Dr Dupont',
    slug: 'dupont-abc12',
    isOnboarded: true,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeConsultationType(overrides = {}) {
  return {
    id: 'ct-1',
    psychologistId: 'psy-1',
    name: 'Séance individuelle',
    duration: 60,
    rate: 70,
    color: '#3D52A0',
    category: 'standard',
    isPublic: true,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createService(): ConsultationTypesService {
  return new ConsultationTypesService(mockPrisma as never);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConsultationTypesService', () => {
  let service: ConsultationTypesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // -------------------------------------------------------------------------
  // findAll()
  // -------------------------------------------------------------------------

  describe('findAll()', () => {
    it('retourne les types triés par sortOrder', async () => {
      const psy = makePsy();
      const types = [
        makeConsultationType({ sortOrder: 0 }),
        makeConsultationType({ id: 'ct-2', sortOrder: 1, name: 'Bilan' }),
      ];

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.findMany.mockResolvedValue(types);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.consultationType.findMany).toHaveBeenCalledWith({
        where: { psychologistId: 'psy-1' },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('lève ForbiddenException si psychologue introuvable', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValue(null);

      await expect(service.findAll('user-unknown')).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // create()
  // -------------------------------------------------------------------------

  describe('create()', () => {
    it('crée un type standard avec succès', async () => {
      const psy = makePsy();
      const created = makeConsultationType();

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.count.mockResolvedValue(2);
      mockPrisma.consultationType.findFirst.mockResolvedValue({ sortOrder: 1 });
      mockPrisma.consultationType.create.mockResolvedValue(created);

      const result = await service.create('user-1', {
        name: 'Séance individuelle',
        duration: 60,
        rate: 70,
      });

      expect(result).toEqual(created);
      expect(mockPrisma.consultationType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          psychologistId: 'psy-1',
          name: 'Séance individuelle',
          duration: 60,
          rate: 70,
          category: 'standard',
          sortOrder: 2,
        }),
      });
    });

    it('force le tarif à 50€ pour la catégorie mon_soutien_psy', async () => {
      const psy = makePsy();
      const created = makeConsultationType({ category: 'mon_soutien_psy', rate: 50 });

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.count.mockResolvedValue(0);
      mockPrisma.consultationType.findFirst.mockResolvedValue(null);
      mockPrisma.consultationType.create.mockResolvedValue(created);

      await service.create('user-1', {
        name: 'MSP Évaluation',
        duration: 45,
        rate: 999, // Tentative de tarif non réglementé
        category: 'mon_soutien_psy' as never,
      });

      expect(mockPrisma.consultationType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rate: 50, // Forcé à 50€
          category: 'mon_soutien_psy',
        }),
      });
    });

    it('rejette la création au-delà de 20 types', async () => {
      const psy = makePsy();

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.count.mockResolvedValue(20);

      await expect(
        service.create('user-1', {
          name: 'Type en trop',
          duration: 30,
          rate: 50,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // update()
  // -------------------------------------------------------------------------

  describe('update()', () => {
    it('met à jour un type standard', async () => {
      const psy = makePsy();
      const existing = makeConsultationType();
      const updated = makeConsultationType({ name: 'Séance longue', duration: 90 });

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.findFirst.mockResolvedValue(existing);
      mockPrisma.consultationType.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 'ct-1', {
        name: 'Séance longue',
        duration: 90,
      });

      expect(result.name).toBe('Séance longue');
    });

    it('force le tarif à 50€ pour un type MSP existant', async () => {
      const psy = makePsy();
      const existing = makeConsultationType({ category: 'mon_soutien_psy', rate: 50 });
      const updated = makeConsultationType({ category: 'mon_soutien_psy', rate: 50, name: 'MSP Renommé' });

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.findFirst.mockResolvedValue(existing);
      mockPrisma.consultationType.update.mockResolvedValue(updated);

      await service.update('user-1', 'ct-1', {
        name: 'MSP Renommé',
        rate: 120, // Tentative de modifier le tarif
      });

      expect(mockPrisma.consultationType.update).toHaveBeenCalledWith({
        where: { id: 'ct-1' },
        data: expect.objectContaining({
          rate: 50, // Forcé à 50€
          name: 'MSP Renommé',
        }),
      });
    });

    it('force le tarif à 50€ quand la catégorie passe à MSP', async () => {
      const psy = makePsy();
      const existing = makeConsultationType({ category: 'standard', rate: 70 });

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.findFirst.mockResolvedValue(existing);
      mockPrisma.consultationType.update.mockResolvedValue(
        makeConsultationType({ category: 'mon_soutien_psy', rate: 50 }),
      );

      await service.update('user-1', 'ct-1', {
        category: 'mon_soutien_psy' as never,
      });

      expect(mockPrisma.consultationType.update).toHaveBeenCalledWith({
        where: { id: 'ct-1' },
        data: expect.objectContaining({
          rate: 50,
          category: 'mon_soutien_psy',
        }),
      });
    });

    it('lève NotFoundException si le type n\'appartient pas au psy', async () => {
      const psy = makePsy();

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'ct-unknown', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // deactivate()
  // -------------------------------------------------------------------------

  describe('deactivate()', () => {
    it('désactive un type existant', async () => {
      const psy = makePsy();
      const existing = makeConsultationType();
      const deactivated = makeConsultationType({ isActive: false });

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.findFirst.mockResolvedValue(existing);
      mockPrisma.consultationType.update.mockResolvedValue(deactivated);

      const result = await service.deactivate('user-1', 'ct-1');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.consultationType.update).toHaveBeenCalledWith({
        where: { id: 'ct-1' },
        data: { isActive: false },
      });
    });

    it('lève NotFoundException pour un ID inconnu ou mauvais propriétaire', async () => {
      const psy = makePsy();

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.consultationType.findFirst.mockResolvedValue(null);

      await expect(service.deactivate('user-1', 'ct-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // createDefaultsForPsy()
  // -------------------------------------------------------------------------

  describe('createDefaultsForPsy()', () => {
    it('crée le type par défaut si aucun type existant', async () => {
      mockPrisma.consultationType.count.mockResolvedValue(0);
      mockPrisma.consultationType.create.mockResolvedValue(makeConsultationType());

      await service.createDefaultsForPsy('psy-1', 75);

      expect(mockPrisma.consultationType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          psychologistId: 'psy-1',
          name: 'Séance individuelle',
          duration: 60,
          rate: 75,
        }),
      });
    });

    it('ne crée rien si des types existent déjà', async () => {
      mockPrisma.consultationType.count.mockResolvedValue(3);

      await service.createDefaultsForPsy('psy-1');

      expect(mockPrisma.consultationType.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // createMspDefaults()
  // -------------------------------------------------------------------------

  describe('createMspDefaults()', () => {
    it('crée les 2 types MSP si aucun MSP existant', async () => {
      mockPrisma.consultationType.count.mockResolvedValue(0);
      mockPrisma.consultationType.createMany.mockResolvedValue({ count: 2 });

      await service.createMspDefaults('psy-1');

      expect(mockPrisma.consultationType.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Mon Soutien Psy — Évaluation',
            rate: 50,
            category: 'mon_soutien_psy',
          }),
          expect.objectContaining({
            name: 'Mon Soutien Psy — Suivi',
            rate: 50,
            category: 'mon_soutien_psy',
          }),
        ]),
      });
    });

    it('ne crée rien si des types MSP existent déjà', async () => {
      mockPrisma.consultationType.count.mockResolvedValue(2);

      await service.createMspDefaults('psy-1');

      expect(mockPrisma.consultationType.createMany).not.toHaveBeenCalled();
    });
  });
});
