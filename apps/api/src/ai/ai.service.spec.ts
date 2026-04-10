import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AiService } from './ai.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockPsychologist = { id: 'psy-uuid', userId: 'user-uuid' };

function createPrismaMock() {
  return {
    psychologist: { findUnique: vi.fn() },
    aiUsage: { create: vi.fn().mockResolvedValue({}) },
    marketingContent: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  };
}

function createConfigMock(openrouterKey?: string) {
  return {
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'OPENROUTER_API_KEY') return openrouterKey;
      return undefined;
    }),
  };
}

function buildFetchJsonMock(body: object) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AiService', () => {
  let service: AiService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    prisma = createPrismaMock();
    prisma.psychologist.findUnique.mockResolvedValue(mockPsychologist);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function buildService(openrouterKey?: string) {
    const encryptionMock = { decrypt: vi.fn().mockReturnValue('decrypted text') };
    const s = new AiService(prisma as any, createConfigMock(openrouterKey) as any, encryptionMock as any);
    s.onModuleInit();
    return s;
  }

  // ─── onModuleInit ──────────────────────────────────────────────────────────

  describe('onModuleInit', () => {
    it('sets OpenRouter when OPENROUTER_API_KEY is present', () => {
      service = buildService('sk-or-v1-test');
      expect(() => (service as any).requireAiKey()).not.toThrow();
      expect((service as any).aiApiKey).toBe('sk-or-v1-test');
    });

    it('sets API key to null when no key is configured', () => {
      service = buildService();
      expect((service as any).aiApiKey).toBeNull();
    });

    it('uses default models when not configured', () => {
      service = buildService('sk-or-v1-test');
      expect((service as any).modelMain).toBe('anthropic/claude-sonnet-4');
      expect((service as any).modelFast).toBe('anthropic/claude-haiku-4');
    });
  });

  // ─── requireAiKey ──────────────────────────────────────────────────────────

  describe('requireAiKey', () => {
    it('throws BadRequestException when no AI key configured', () => {
      service = buildService();
      expect(() => (service as any).requireAiKey()).toThrow(BadRequestException);
    });

    it('returns key when configured', () => {
      service = buildService('sk-or-v1-test');
      expect((service as any).requireAiKey()).toBe('sk-or-v1-test');
    });
  });

  // ─── generateExercise ─────────────────────────────────────────────────────

  describe('generateExercise', () => {
    it('throws ForbiddenException when psychologist not found', async () => {
      service = buildService('sk-or-v1-test');
      prisma.psychologist.findUnique.mockResolvedValue(null);
      await expect(
        service.generateExercise('user-uuid', {
          patientContext: 'contexte test',
          theme: 'anxiété',
          exerciseType: 'breathing',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when no AI key', async () => {
      service = buildService();
      await expect(
        service.generateExercise('user-uuid', {
          patientContext: 'contexte',
          theme: 'anxiété',
          exerciseType: 'breathing',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls OpenRouter API and returns parsed JSON exercise', async () => {
      service = buildService('sk-or-v1-test');
      const exercisePayload = {
        choices: [{ message: { content: '{"title":"Respiration 4-7-8","description":"Exercice","instructions":["étape1"],"duration":"5min","frequency":"2x/jour","disclaimer":"Consultez un médecin"}' } }],
      };
      global.fetch = buildFetchJsonMock(exercisePayload);

      const result = await service.generateExercise('user-uuid', {
        patientContext: 'anxiété sociale',
        theme: 'respiration',
        exerciseType: 'breathing',
      });

      expect(global.fetch).toHaveBeenCalledOnce();
      const [url] = (global.fetch as any).mock.calls[0] as [string];
      expect(url).toContain('openrouter.ai');
      expect(result).toHaveProperty('title', 'Respiration 4-7-8');
    });

    it('returns empty object when API returns malformed JSON', async () => {
      service = buildService('sk-or-v1-test');
      global.fetch = buildFetchJsonMock({ choices: [{ message: { content: 'pas du JSON valide' } }] });

      const result = await service.generateExercise('user-uuid', {
        patientContext: 'test',
        theme: 'test',
        exerciseType: 'mindfulness',
      });

      expect(result).toEqual({});
    });
  });

  // ─── generateContent ──────────────────────────────────────────────────────

  describe('generateContent', () => {
    it('throws ForbiddenException when psychologist not found', async () => {
      service = buildService('sk-or-v1-test');
      prisma.psychologist.findUnique.mockResolvedValue(null);
      await expect(
        service.generateContent('user-uuid', { type: 'linkedin', theme: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns content with correct type for linkedin', async () => {
      service = buildService('sk-or-v1-test');
      global.fetch = buildFetchJsonMock({ choices: [{ message: { content: 'Post LinkedIn généré...' } }] });

      const result = await service.generateContent('user-uuid', {
        type: 'linkedin',
        theme: 'gestion du stress',
        tone: 'professional',
      });

      expect(result).toEqual({ content: 'Post LinkedIn généré...', type: 'linkedin' });
    });

    it('calls OpenRouter API with correct model', async () => {
      service = buildService('sk-or-v1-test');
      global.fetch = buildFetchJsonMock({ choices: [{ message: { content: 'Contenu blog' } }] });

      await service.generateContent('user-uuid', { type: 'blog', theme: 'TCC' });

      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body as string) as { model: string };
      expect(body.model).toBe('anthropic/claude-sonnet-4');
    });
  });

  // ─── saveMarketingContent ─────────────────────────────────────────────────

  describe('saveMarketingContent', () => {
    it('saves content to DB and returns the created record', async () => {
      service = buildService('sk-or-v1-test');
      const saved = { id: 'mc-1', type: 'linkedin', theme: 'test', tone: 'professional', content: 'Post...' };
      prisma.marketingContent.create.mockResolvedValue(saved);

      const result = await service.saveMarketingContent('user-uuid', {
        type: 'linkedin', theme: 'test', tone: 'professional', content: 'Post...',
      });

      expect(prisma.marketingContent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            psychologistId: mockPsychologist.id,
            type: 'linkedin',
          }),
        }),
      );
      expect(result).toEqual(saved);
    });

    it('throws ForbiddenException when psychologist not found', async () => {
      service = buildService('sk-or-v1-test');
      prisma.psychologist.findUnique.mockResolvedValue(null);

      await expect(
        service.saveMarketingContent('user-uuid', { type: 'blog', theme: 'test', tone: 'warm', content: 'texte' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
