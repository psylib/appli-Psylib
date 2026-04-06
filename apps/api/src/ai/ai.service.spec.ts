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

function createConfigMock(anthropicKey?: string, openaiKey?: string) {
  return {
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'ANTHROPIC_API_KEY') return anthropicKey;
      if (key === 'OPENAI_API_KEY') return openaiKey;
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

  function buildService(anthropicKey?: string, openaiKey?: string) {
    const encryptionMock = { decrypt: vi.fn().mockReturnValue('decrypted text') };
    const s = new AiService(prisma as any, createConfigMock(anthropicKey, openaiKey) as any, encryptionMock as any);
    s.onModuleInit();
    return s;
  }

  // ─── onModuleInit ──────────────────────────────────────────────────────────

  describe('onModuleInit', () => {
    it('sets anthropic provider when ANTHROPIC_API_KEY is present', () => {
      service = buildService('sk-ant-test');
      expect(() => (service as any).requireAiKey()).not.toThrow();
    });

    it('falls back to openai when only OPENAI_API_KEY is present', () => {
      service = buildService(undefined, 'sk-openai-test');
      expect((service as any).aiProvider).toBe('openai');
      expect(() => (service as any).requireAiKey()).not.toThrow();
    });

    it('sets provider to null when no key is configured', () => {
      service = buildService();
      expect((service as any).aiProvider).toBeNull();
    });
  });

  // ─── requireAiKey ──────────────────────────────────────────────────────────

  describe('requireAiKey', () => {
    it('throws BadRequestException when no AI key configured', () => {
      service = buildService();
      expect(() => (service as any).requireAiKey()).toThrow(BadRequestException);
    });

    it('returns key when Anthropic is configured', () => {
      service = buildService('sk-ant-test');
      expect((service as any).requireAiKey()).toBe('sk-ant-test');
    });
  });

  // ─── generateExercise ─────────────────────────────────────────────────────

  describe('generateExercise', () => {
    it('throws ForbiddenException when psychologist not found', async () => {
      service = buildService('sk-ant-test');
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

    it('calls Anthropic API and returns parsed JSON exercise', async () => {
      service = buildService('sk-ant-test');
      const exercisePayload = {
        content: [{ text: '{"title":"Respiration 4-7-8","description":"Exercice","instructions":["étape1"],"duration":"5min","frequency":"2x/jour","disclaimer":"Consultez un médecin"}' }],
      };
      global.fetch = buildFetchJsonMock(exercisePayload);

      const result = await service.generateExercise('user-uuid', {
        patientContext: 'anxiété sociale',
        theme: 'respiration',
        exerciseType: 'breathing',
      });

      expect(global.fetch).toHaveBeenCalledOnce();
      const [url] = (global.fetch as any).mock.calls[0] as [string];
      expect(url).toContain('anthropic.com');
      expect(result).toHaveProperty('title', 'Respiration 4-7-8');
    });

    it('returns empty object when API returns malformed JSON', async () => {
      service = buildService('sk-ant-test');
      global.fetch = buildFetchJsonMock({ content: [{ text: 'pas du JSON valide' }] });

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
      service = buildService('sk-ant-test');
      prisma.psychologist.findUnique.mockResolvedValue(null);
      await expect(
        service.generateContent('user-uuid', { type: 'linkedin', theme: 'test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns content with correct type for linkedin', async () => {
      service = buildService('sk-ant-test');
      global.fetch = buildFetchJsonMock({ content: [{ text: 'Post LinkedIn généré...' }] });

      const result = await service.generateContent('user-uuid', {
        type: 'linkedin',
        theme: 'gestion du stress',
        tone: 'professional',
      });

      expect(result).toEqual({ content: 'Post LinkedIn généré...', type: 'linkedin' });
    });

    it('calls Anthropic API with correct model for text generation', async () => {
      service = buildService('sk-ant-test');
      global.fetch = buildFetchJsonMock({ content: [{ text: 'Contenu blog' }] });

      await service.generateContent('user-uuid', { type: 'blog', theme: 'TCC' });

      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body as string) as { model: string };
      expect(body.model).toContain('claude');
    });
  });

  // ─── saveMarketingContent ─────────────────────────────────────────────────

  describe('saveMarketingContent', () => {
    it('saves content to DB and returns the created record', async () => {
      service = buildService('sk-ant-test');
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
      service = buildService('sk-ant-test');
      prisma.psychologist.findUnique.mockResolvedValue(null);

      await expect(
        service.saveMarketingContent('user-uuid', { type: 'blog', theme: 'test', tone: 'warm', content: 'texte' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
