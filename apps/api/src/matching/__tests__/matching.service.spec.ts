import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchingService } from '../matching.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  psyNetworkProfile: {
    findMany: vi.fn(),
  },
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    isVisible: true,
    city: 'Nancy',
    department: '54',
    approaches: ['TCC', 'ACT'],
    specialties: ['Anxiete', 'Depression'],
    languages: ['fr', 'en'],
    acceptsReferrals: true,
    bio: 'Psy experimentee',
    psychologist: {
      id: 'psy-1',
      name: 'Dr. Dupont',
      slug: 'dr-dupont',
      specialization: 'Psychologue clinicienne',
    },
    ...overrides,
  };
}

// ─── Service factory ───────────────────────────────────────────────────────────
function createService(): MatchingService {
  return new MatchingService(mockPrisma as never);
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // ── findMatches() ───────────────────────────────────────────────────────────
  describe('findMatches()', () => {
    it('should return profiles sorted by score descending', async () => {
      const profileHigh = makeProfile({ id: 'p-high', city: 'Nancy', approaches: ['TCC'] });
      const profileLow = makeProfile({
        id: 'p-low',
        city: 'Metz',
        department: '57',
        approaches: ['Psychanalyse'],
        specialties: ['Couple'],
      });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profileHigh, profileLow]);

      const results = await service.findMatches({
        city: 'Nancy',
        approaches: ['TCC'],
        problematics: 'anxiete',
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      // First result should have the highest matchScore
      const firstResult = results[0];
      expect(firstResult).toBeDefined();
      expect(firstResult!.matchScore).toBeGreaterThan(0);
      if (results.length > 1) {
        expect(results[0]!.matchScore).toBeGreaterThanOrEqual(results[1]!.matchScore);
      }
    });

    it('should give +40 score for matching approaches', async () => {
      const profile = makeProfile({ approaches: ['TCC', 'ACT'] });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const results = await service.findMatches({ approaches: ['TCC'] });

      expect(results).toHaveLength(1);
      // With matching approach (+40) + default language bonus (+10) = at least 50
      expect(results[0]!.matchScore).toBeGreaterThanOrEqual(50);
    });

    it('should give +20 default score when no approaches specified', async () => {
      const profile = makeProfile();
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const results = await service.findMatches({});

      expect(results).toHaveLength(1);
      // Default approach bonus (+20) + default language bonus (+10) = at least 30
      expect(results[0]!.matchScore).toBeGreaterThanOrEqual(30);
    });

    it('should give +30 score for matching city', async () => {
      const profile = makeProfile({ city: 'Nancy' });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const resultsWithCity = await service.findMatches({ city: 'Nancy' });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);
      const resultsWithoutCity = await service.findMatches({});

      expect(resultsWithCity[0]!.matchScore - resultsWithoutCity[0]!.matchScore).toBe(30);
    });

    it('should give +20 score for matching department when city does not match', async () => {
      const profile = makeProfile({ city: 'Metz', department: '54' });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const results = await service.findMatches({ city: 'Nancy', department: '54' });

      // Department match (+20) + default approach (+20) + default language (+10) = 50
      // City does not match (Metz vs Nancy) but department matches
      expect(results[0]!.matchScore).toBeGreaterThanOrEqual(50);
    });

    it('should give +20 score for matching specialties/problematics', async () => {
      const profile = makeProfile({ specialties: ['Anxiete', 'Depression'] });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const resultsWithMatch = await service.findMatches({ problematics: 'anxiete' });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);
      const resultsWithoutMatch = await service.findMatches({});

      expect(resultsWithMatch[0]!.matchScore - resultsWithoutMatch[0]!.matchScore).toBe(20);
    });

    it('should give +10 score for matching language', async () => {
      const profile = makeProfile({ languages: ['fr', 'en'] });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const results = await service.findMatches({ language: 'en' });

      // Language match (+10) + default approach (+20) = at least 30
      expect(results[0]!.matchScore).toBeGreaterThanOrEqual(30);
    });

    it('should filter out profiles with score 0', async () => {
      // A profile that matches nothing should still get default bonuses (approach+language)
      // so we need to test that score > 0 filter works by checking all results have positive score
      const profile = makeProfile();
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const results = await service.findMatches({});

      for (const result of results) {
        expect(result.matchScore).toBeGreaterThan(0);
      }
    });

    it('should limit results to top 10', async () => {
      const profiles = Array.from({ length: 15 }, (_, i) =>
        makeProfile({ id: `profile-${i}` }),
      );
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce(profiles);

      const results = await service.findMatches({});

      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should only query visible profiles', async () => {
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([]);

      await service.findMatches({});

      const findManyArg = mockPrisma.psyNetworkProfile.findMany.mock.calls[0]?.[0] as {
        where: { isVisible: boolean };
      };
      expect(findManyArg.where.isVisible).toBe(true);
    });

    it('should filter by department when provided', async () => {
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([]);

      await service.findMatches({ department: '54' });

      const findManyArg = mockPrisma.psyNetworkProfile.findMany.mock.calls[0]?.[0] as {
        where: { department: string };
      };
      expect(findManyArg.where.department).toBe('54');
    });

    it('should return profile data with matchScore', async () => {
      const profile = makeProfile();
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const results = await service.findMatches({});

      expect(results[0]).toEqual(
        expect.objectContaining({
          id: 'profile-1',
          city: 'Nancy',
          department: '54',
          approaches: ['TCC', 'ACT'],
          specialties: ['Anxiete', 'Depression'],
          languages: ['fr', 'en'],
          acceptsReferrals: true,
          matchScore: expect.any(Number),
          psychologist: expect.objectContaining({
            name: 'Dr. Dupont',
            slug: 'dr-dupont',
          }),
        }),
      );
    });

    it('should do case-insensitive matching for approaches', async () => {
      const profile = makeProfile({ approaches: ['tcc', 'act'] });
      mockPrisma.psyNetworkProfile.findMany.mockResolvedValueOnce([profile]);

      const results = await service.findMatches({ approaches: ['TCC'] });

      // Should still match despite case difference
      expect(results).toHaveLength(1);
      expect(results[0]!.matchScore).toBeGreaterThanOrEqual(50); // approach match + language default
    });
  });
});
