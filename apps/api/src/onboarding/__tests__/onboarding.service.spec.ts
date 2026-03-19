import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OnboardingService } from '../onboarding.service';
import type { ConfigService } from '@nestjs/config';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  psychologist: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  onboardingProgress: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

const mockEmail = {
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  get: vi.fn((key: string) => {
    if (key === 'FRONTEND_URL') return 'https://psylib.eu';
    return undefined;
  }),
} as unknown as ConfigService;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makePsy(overrides = {}) {
  return {
    id: 'psy-1',
    userId: 'user-1',
    name: 'Dr Dupont',
    slug: null,
    specialization: null,
    bio: null,
    phone: null,
    address: null,
    adeliNumber: null,
    isOnboarded: false,
    defaultSessionDuration: 50,
    defaultSessionRate: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeProgress(overrides = {}) {
  return {
    id: 'prog-1',
    psychologistId: 'psy-1',
    stepsCompleted: [],
    completedAt: null,
    ...overrides,
  };
}

function makeUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'dupont@example.com',
    ...overrides,
  };
}

function createService(): OnboardingService {
  return new OnboardingService(
    mockPrisma as never,
    mockEmail as never,
    mockConfig,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // -------------------------------------------------------------------------
  // getProgress()
  // -------------------------------------------------------------------------

  describe('getProgress()', () => {
    it('retourne le progrès existant si déjà créé', async () => {
      const psy = makePsy();
      const progress = makeProgress({ stepsCompleted: ['profile'] });
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);

      const result = await service.getProgress('user-1');

      expect(result).toEqual(progress);
      expect(mockPrisma.onboardingProgress.create).not.toHaveBeenCalled();
    });

    it('crée un nouveau progrès si premier accès (lazy init)', async () => {
      const psy = makePsy();
      const newProgress = makeProgress();
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(null);
      mockPrisma.onboardingProgress.create.mockResolvedValue(newProgress);

      const result = await service.getProgress('user-1');

      expect(mockPrisma.onboardingProgress.create).toHaveBeenCalledWith({
        data: { psychologistId: 'psy-1', stepsCompleted: [] },
      });
      expect(result).toEqual(newProgress);
    });

    it('retourne stepsCompleted comme tableau', async () => {
      const psy = makePsy();
      const progress = makeProgress({ stepsCompleted: ['profile', 'practice'] });
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);

      const result = await service.getProgress('user-1');

      expect(Array.isArray(result.stepsCompleted)).toBe(true);
      expect(result.stepsCompleted).toHaveLength(2);
    });

    it('lève ForbiddenException si le profil psychologue est introuvable', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValue(null);

      await expect(service.getProgress('user-unknown')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // completeStep()
  // -------------------------------------------------------------------------

  describe('completeStep()', () => {
    it('ajoute l\'étape au Set des étapes complètes', async () => {
      const psy = makePsy();
      const progress = makeProgress({ stepsCompleted: [] });
      const updatedProgress = makeProgress({ stepsCompleted: ['profile'] });

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);
      mockPrisma.onboardingProgress.update.mockResolvedValue(updatedProgress);

      const result = await service.completeStep('user-1', 'profile');

      expect(mockPrisma.onboardingProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { psychologistId: 'psy-1' },
          data: expect.objectContaining({
            stepsCompleted: ['profile'],
          }),
        }),
      );
      expect(result).toEqual(updatedProgress);
    });

    it("n'ajoute pas l'étape en doublon", async () => {
      const psy = makePsy();
      const progress = makeProgress({ stepsCompleted: ['profile', 'practice'] });
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);
      mockPrisma.onboardingProgress.update.mockResolvedValue(progress);

      await service.completeStep('user-1', 'profile');

      const updateCall = mockPrisma.onboardingProgress.update.mock.calls[0];
      const updatedSteps: string[] = updateCall[0].data.stepsCompleted;
      const profileOccurrences = updatedSteps.filter((s) => s === 'profile').length;
      expect(profileOccurrences).toBe(1);
    });

    it('marque completedAt quand les 5 étapes sont complètes', async () => {
      const psy = makePsy();
      const allFour = ['practice', 'preferences', 'first_patient', 'billing'];
      const progress = makeProgress({ stepsCompleted: allFour });
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);
      mockPrisma.onboardingProgress.update.mockResolvedValue({
        ...progress,
        stepsCompleted: [...allFour, 'profile'],
        completedAt: new Date(),
      });

      await service.completeStep('user-1', 'profile');

      const updateCall = mockPrisma.onboardingProgress.update.mock.calls[0];
      expect(updateCall[0].data.completedAt).toBeInstanceOf(Date);
    });

    it('completedAt est null si toutes les étapes ne sont pas complètes', async () => {
      const psy = makePsy();
      const progress = makeProgress({ stepsCompleted: ['practice'] });
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);
      mockPrisma.onboardingProgress.update.mockResolvedValue(progress);

      await service.completeStep('user-1', 'preferences');

      const updateCall = mockPrisma.onboardingProgress.update.mock.calls[0];
      expect(updateCall[0].data.completedAt).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // updateProfile()
  // -------------------------------------------------------------------------

  describe('updateProfile()', () => {
    it('met à jour les champs du profil', async () => {
      const psy = makePsy({ slug: 'dupont-abc12' });
      const updatedPsy = { ...psy, name: 'Dr Martin', specialization: 'TCC' };
      const progress = makeProgress({ stepsCompleted: ['profile'] });

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.psychologist.update.mockResolvedValue(updatedPsy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);
      mockPrisma.onboardingProgress.update.mockResolvedValue(progress);

      const result = await service.updateProfile('user-1', {
        name: 'Dr Martin',
        specialization: 'TCC',
      });

      expect(mockPrisma.psychologist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'psy-1' },
          data: expect.objectContaining({ name: 'Dr Martin', specialization: 'TCC' }),
        }),
      );
      expect(result).toEqual(updatedPsy);
    });

    it('génère un slug si slug est null', async () => {
      const psy = makePsy({ slug: null });
      const updatedPsy = { ...psy, name: 'Dr Leroy', slug: 'dr-leroy-xxxxx' };
      const progress = makeProgress();

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.psychologist.update.mockResolvedValue(updatedPsy);
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);
      mockPrisma.onboardingProgress.update.mockResolvedValue(progress);

      await service.updateProfile('user-1', { name: 'Dr Leroy' });

      const updateCall = mockPrisma.psychologist.update.mock.calls[0];
      expect(updateCall[0].data).toHaveProperty('slug');
      expect(typeof updateCall[0].data.slug).toBe('string');
      expect((updateCall[0].data.slug as string).length).toBeGreaterThan(0);
    });

    it("ne génère pas de slug si le psy en possède déjà un", async () => {
      const psy = makePsy({ slug: 'dupont-existing' });
      const progress = makeProgress({ stepsCompleted: ['profile'] });

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.psychologist.update.mockResolvedValue({ ...psy, bio: 'Bonjour' });
      mockPrisma.onboardingProgress.findUnique.mockResolvedValue(progress);
      mockPrisma.onboardingProgress.update.mockResolvedValue(progress);

      await service.updateProfile('user-1', { bio: 'Bonjour' });

      const updateCall = mockPrisma.psychologist.update.mock.calls[0];
      // slug ne doit pas figurer dans data quand il ne change pas
      expect(updateCall[0].data).not.toHaveProperty('slug');
    });
  });

  // -------------------------------------------------------------------------
  // markOnboarded()
  // -------------------------------------------------------------------------

  describe('markOnboarded()', () => {
    it('passe isOnboarded à true', async () => {
      const psy = makePsy();
      const user = makeUser();
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.psychologist.update.mockResolvedValue({ ...psy, isOnboarded: true });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.markOnboarded('user-1');

      expect(mockPrisma.psychologist.update).toHaveBeenCalledWith({
        where: { id: 'psy-1' },
        data: { isOnboarded: true },
      });
      expect(result.isOnboarded).toBe(true);
    });

    it('envoie un email de bienvenue (non-bloquant — void)', async () => {
      const psy = makePsy();
      const user = makeUser();
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.psychologist.update.mockResolvedValue({ ...psy, isOnboarded: true });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await service.markOnboarded('user-1');

      // On attend la fin de la microtask (void = fire & forget)
      await vi.runAllTimersAsync().catch(() => undefined);

      expect(mockEmail.sendWelcomeEmail).toHaveBeenCalledWith(
        user.email,
        expect.objectContaining({
          psychologistName: psy.name,
          dashboardUrl: expect.stringContaining('/dashboard'),
        }),
      );
    });

    it("ne lève pas d'erreur si l'utilisateur est introuvable pour l'email", async () => {
      const psy = makePsy();
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.psychologist.update.mockResolvedValue({ ...psy, isOnboarded: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.markOnboarded('user-1')).resolves.not.toThrow();
      expect(mockEmail.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("ne lève pas d'erreur si l'email est non-bloquant (void fire-and-forget)", async () => {
      const psy = makePsy();
      const user = makeUser();
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.psychologist.update.mockResolvedValue({ ...psy, isOnboarded: true });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      // On simule un délai long mais on laisse résoudre normalement
      // (la résolution ou l'échec de l'email ne doit pas bloquer markOnboarded)
      mockEmail.sendWelcomeEmail.mockResolvedValue(undefined);

      // markOnboarded retourne avant que l'email soit envoyé (void = non-bloquant)
      const result = await service.markOnboarded('user-1');
      expect(result).toBeDefined();
      expect(result.isOnboarded).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // getPsychologistProfile()
  // -------------------------------------------------------------------------

  describe('getPsychologistProfile()', () => {
    it('retourne le profil existant', async () => {
      const psy = { ...makePsy(), subscription: null };
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);

      const result = await service.getPsychologistProfile('user-1');

      expect(result).toEqual(psy);
      expect(mockPrisma.psychologist.create).not.toHaveBeenCalled();
    });

    it('crée le profil si premier accès (auto-create)', async () => {
      const user = makeUser({ email: 'nouveau@example.com' });
      const createdPsy = { ...makePsy({ name: 'nouveau', slug: 'nouveau-xxxxx' }), subscription: null };

      mockPrisma.psychologist.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.psychologist.create.mockResolvedValue(createdPsy);

      const result = await service.getPsychologistProfile('user-1');

      expect(mockPrisma.psychologist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            isOnboarded: false,
          }),
        }),
      );
      expect(result).toEqual(createdPsy);
    });

    it('lève NotFoundException si utilisateur introuvable lors de la création', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getPsychologistProfile('user-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
