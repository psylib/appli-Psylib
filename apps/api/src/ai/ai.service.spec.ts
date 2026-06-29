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
      expect((service as any).modelFast).toBe('anthropic/claude-haiku-4.5');
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

  // ─── Carte mentale IA ───────────────────────────────────────────────────────
  describe('generateMindMap', () => {
    function buildMindMapEnv(opts: { session?: unknown; consent?: unknown } = {}) {
      const prismaLocal = {
        psychologist: { findUnique: vi.fn().mockResolvedValue(mockPsychologist) },
        session: {
          findUnique: vi.fn().mockResolvedValue({ patientId: 'pat1' }), // checkAiConsent
          findFirst: vi.fn().mockResolvedValue(
            'session' in opts ? opts.session : { patientId: 'pat1', summaryAi: 'cipher', notes: null, scribeTranscript: null },
          ),
          update: vi.fn().mockResolvedValue({}),
        },
        gdprConsent: { findFirst: vi.fn().mockResolvedValue('consent' in opts ? opts.consent : { id: 'c1' }) },
        aiUsage: { create: vi.fn().mockResolvedValue({}) },
      };
      const encryption = {
        decrypt: vi.fn().mockReturnValue('Le patient évoque son anxiété au travail et des troubles du sommeil.'),
        encrypt: vi.fn().mockReturnValue('encrypted-mindmap'),
      };
      const audit = { log: vi.fn().mockResolvedValue(undefined) };
      const s = new AiService(prismaLocal as any, createConfigMock('key') as any, encryption as any, {} as any, audit as any);
      s.onModuleInit();
      return { s, prismaLocal, encryption, audit };
    }

    it('refuse (Forbidden) si le patient n’a pas consenti au traitement IA', async () => {
      const { s } = buildMindMapEnv({ consent: null });
      await expect(s.generateMindMap('user-uuid', 'sess1')).rejects.toThrow(ForbiddenException);
    });

    it('refuse (BadRequest) si aucun contenu exploitable', async () => {
      const { s } = buildMindMapEnv({ session: { patientId: 'pat1', summaryAi: null, notes: null, scribeTranscript: null } });
      await expect(s.generateMindMap('user-uuid', 'sess1')).rejects.toThrow(BadRequestException);
    });

    it('génère, sanitize, chiffre et persiste la carte mentale', async () => {
      const { s, prismaLocal, encryption, audit } = buildMindMapEnv();
      global.fetch = buildFetchJsonMock({
        choices: [{ message: { content: '{"label":"Séance","children":[{"label":"Anxiété"},{"label":"Sommeil"}]}' } }],
        usage: { total_tokens: 320 },
      });

      const { mindMap } = await s.generateMindMap('user-uuid', 'sess1');

      expect(mindMap.label).toBe('Séance');
      expect(mindMap.children).toHaveLength(2);
      // chiffré avant stockage
      expect(encryption.encrypt).toHaveBeenCalled();
      expect(prismaLocal.session.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { mindMap: 'encrypted-mindmap' } }),
      );
      // audit DECRYPT (avant LLM) + CREATE
      const actions = audit.log.mock.calls.map((c: any[]) => c[0]?.action);
      expect(actions).toContain('DECRYPT');
      expect(actions).toContain('CREATE');
    });
  });

  describe('getMindMap', () => {
    it('renvoie null si aucune carte stockée', async () => {
      const prismaLocal = {
        psychologist: { findUnique: vi.fn().mockResolvedValue(mockPsychologist) },
        session: { findFirst: vi.fn().mockResolvedValue({ mindMap: null }) },
      };
      const s = new AiService(prismaLocal as any, createConfigMock('key') as any, { decrypt: vi.fn() } as any, {} as any, { log: vi.fn() } as any);
      s.onModuleInit();
      expect(await s.getMindMap('user-uuid', 'sess1')).toEqual({ mindMap: null });
    });

    it('déchiffre et parse la carte stockée', async () => {
      const prismaLocal = {
        psychologist: { findUnique: vi.fn().mockResolvedValue(mockPsychologist) },
        session: { findFirst: vi.fn().mockResolvedValue({ mindMap: 'cipher' }) },
      };
      const encryption = { decrypt: vi.fn().mockReturnValue('{"label":"Séance","children":[{"label":"X"}]}') };
      const s = new AiService(prismaLocal as any, createConfigMock('key') as any, encryption as any, {} as any, { log: vi.fn() } as any);
      s.onModuleInit();
      const { mindMap } = await s.getMindMap('user-uuid', 'sess1');
      expect(mindMap?.label).toBe('Séance');
    });
  });

  // ─── HDS: audit DECRYPT lors de la collecte d'historique pour le résumé IA ──
  describe('collectPatientHistory — audit DECRYPT (HDS)', () => {
    function buildWithAudit() {
      const prismaLocal = {
        session: {
          findFirst: vi.fn().mockResolvedValue({
            patientId: 'pat1', orientation: null, date: new Date('2026-06-01'), duration: 50,
          }),
          findMany: vi.fn().mockResolvedValue([
            { id: 's2', date: new Date('2026-05-01'), duration: 50, orientation: null, tags: [], notes: 'cipherNotes', summaryAi: null },
          ]),
        },
      };
      const encryption = { decrypt: vi.fn().mockReturnValue('notes déchiffrées') };
      const audit = { log: vi.fn().mockResolvedValue(undefined), logDecrypt: vi.fn().mockResolvedValue(undefined) };
      const s = new AiService(
        prismaLocal as any,
        createConfigMock('key') as any,
        encryption as any,
        {} as any,        // notifications
        audit as any,     // audit
      );
      return { s, audit, encryption };
    }

    it('émet un audit DECRYPT quand des séances chiffrées sont déchiffrées pour le LLM', async () => {
      const { s, audit } = buildWithAudit();

      await (s as any).collectPatientHistory('s1', 'psy1', 'user1');

      const decryptCalls = [
        ...audit.log.mock.calls.filter((c: any[]) => c[0]?.action === 'DECRYPT'),
        ...audit.logDecrypt.mock.calls,
      ];
      expect(decryptCalls.length).toBeGreaterThan(0);
    });
  });
});
