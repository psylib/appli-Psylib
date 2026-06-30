import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RppsVerificationService } from './rpps-verification.service';

function createConfig(overrides: Record<string, string | undefined> = {}) {
  return {
    get: vi.fn((key: string) => overrides[key]),
  } as unknown as import('@nestjs/config').ConfigService;
}

function fhirBundle(practitioners: object[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      total: practitioners.length,
      entry: practitioners.map((resource) => ({ resource })),
    }),
  };
}

const PSY_PRACTITIONER = {
  resourceType: 'Practitioner',
  name: [{ family: 'Dupont', given: ['Marie'] }],
  qualification: [{ code: { coding: [{ code: '93', display: 'Psychologue' }] } }],
};

const DOCTOR_PRACTITIONER = {
  resourceType: 'Practitioner',
  name: [{ family: 'Martin', given: ['Jean'] }],
  qualification: [{ code: { coding: [{ code: '10', display: 'Médecin' }] } }],
};

describe('RppsVerificationService', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('format validation (offline)', () => {
    it('rejette un numéro de 10 chiffres (cas du faux compte)', async () => {
      const svc = new RppsVerificationService(createConfig({ ESANTE_API_KEY: 'k' }));
      const r = await svc.verify('1172881991');
      expect(r.ok).toBe(false);
      expect(r.blocking).toBe(true);
      expect(r.status).toBe('invalid_format');
    });

    it('accepte le format ADELI (9) et RPPS (11) au niveau format', () => {
      expect(RppsVerificationService.isValidFormat('123456789')).toBe(true);
      expect(RppsVerificationService.isValidFormat('12345678901')).toBe(true);
      expect(RppsVerificationService.isValidFormat('1234567')).toBe(false);
    });

    it('normalise espaces et séparateurs', () => {
      expect(RppsVerificationService.normalize('10 100 092 010')).toBe('10100092010');
    });
  });

  describe('isObviousFake (numéros bidon)', () => {
    it('détecte une suite ascendante (123456789)', () => {
      expect(RppsVerificationService.isObviousFake('123456789')).toBe(true);
    });

    it('détecte une suite descendante (987654321)', () => {
      expect(RppsVerificationService.isObviousFake('987654321')).toBe(true);
    });

    it('détecte un chiffre répété (111111111, 000000000)', () => {
      expect(RppsVerificationService.isObviousFake('111111111')).toBe(true);
      expect(RppsVerificationService.isObviousFake('000000000')).toBe(true);
    });

    it('détecte une suite avec passage par 0 (12345678901)', () => {
      expect(RppsVerificationService.isObviousFake('12345678901')).toBe(true);
    });

    it("n'attrape pas un vrai numéro plausible", () => {
      expect(RppsVerificationService.isObviousFake('10100092010')).toBe(false);
      expect(RppsVerificationService.isObviousFake('10009079111')).toBe(false);
    });
  });

  describe('verify : blocage des numéros bidon (même API down)', () => {
    it('bloque 123456789 avec clé API', async () => {
      const svc = new RppsVerificationService(createConfig({ ESANTE_API_KEY: 'k' }));
      const r = await svc.verify('123456789');
      expect(r.ok).toBe(false);
      expect(r.blocking).toBe(true);
      expect(r.status).toBe('obvious_fake');
    });

    it('bloque 123456789 SANS clé API (annuaire indisponible)', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy as never;
      const svc = new RppsVerificationService(createConfig({}));
      const r = await svc.verify('123456789');
      expect(r.blocking).toBe(true);
      expect(r.status).toBe('obvious_fake');
      // Aucun appel réseau : le garde-fou agit hors-ligne.
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('namesMatch (anti-usurpation)', () => {
    it('match exact prénom + nom', () => {
      expect(RppsVerificationService.namesMatch('Marie', 'Dupont', 'Marie Dupont')).toBe(true);
    });

    it('insensible aux accents et à la casse', () => {
      expect(RppsVerificationService.namesMatch('Hélène', 'Lévêque', 'HELENE LEVEQUE')).toBe(true);
    });

    it('ordre nom/prénom inversé à l’annuaire', () => {
      expect(RppsVerificationService.namesMatch('Marie', 'Dupont', 'Dupont Marie')).toBe(true);
    });

    it('nom composé / marital toléré (un token suffit)', () => {
      expect(RppsVerificationService.namesMatch('Marie', 'Dupont-Martin', 'Marie Dupont')).toBe(true);
      expect(RppsVerificationService.namesMatch('Marie', 'Martin', 'Marie Dupont Martin')).toBe(true);
    });

    it('prénom abrégé à l’annuaire (initiale) toléré', () => {
      expect(RppsVerificationService.namesMatch('Jean', 'Bernard', 'J Bernard')).toBe(true);
    });

    it('REJETTE un nom totalement différent (numéro volé)', () => {
      expect(RppsVerificationService.namesMatch('Pierre', 'Voleur', 'Marie Dupont')).toBe(false);
    });

    it('REJETTE si le nom de famille ne correspond pas', () => {
      expect(RppsVerificationService.namesMatch('Marie', 'Imposteur', 'Marie Dupont')).toBe(false);
    });

    it('false si annuaire absent', () => {
      expect(RppsVerificationService.namesMatch('Marie', 'Dupont', undefined)).toBe(false);
    });
  });

  describe('sans clé API → dégradation gracieuse', () => {
    it('laisse passer (non bloquant) si format valide mais pas de clé', async () => {
      const svc = new RppsVerificationService(createConfig({}));
      const r = await svc.verify('10100092010');
      expect(r.ok).toBe(true);
      expect(r.blocking).toBe(false);
      expect(r.status).toBe('api_unavailable');
    });
  });

  describe('avec clé API (annuaire interrogé)', () => {
    it('verified : numéro RPPS trouvé + psychologue', async () => {
      global.fetch = vi.fn().mockResolvedValue(fhirBundle([PSY_PRACTITIONER])) as never;
      const svc = new RppsVerificationService(createConfig({ ESANTE_API_KEY: 'k' }));
      const r = await svc.verify('10100092010');
      expect(r.status).toBe('verified');
      expect(r.ok).toBe(true);
      expect(r.blocking).toBe(false);
      expect(r.matchedName).toBe('Marie Dupont');
    });

    it('not_found : bundle vide → blocage', async () => {
      global.fetch = vi.fn().mockResolvedValue(fhirBundle([])) as never;
      const svc = new RppsVerificationService(createConfig({ ESANTE_API_KEY: 'k' }));
      const r = await svc.verify('10100092010');
      expect(r.status).toBe('not_found');
      expect(r.blocking).toBe(true);
    });

    it('not_psychologist : trouvé mais médecin → blocage', async () => {
      global.fetch = vi.fn().mockResolvedValue(fhirBundle([DOCTOR_PRACTITIONER])) as never;
      const svc = new RppsVerificationService(createConfig({ ESANTE_API_KEY: 'k' }));
      const r = await svc.verify('10100092010');
      expect(r.status).toBe('not_psychologist');
      expect(r.blocking).toBe(true);
    });

    it('not_psychologist ignoré si RPPS_REQUIRE_PSYCHOLOGIST=false', async () => {
      global.fetch = vi.fn().mockResolvedValue(fhirBundle([DOCTOR_PRACTITIONER])) as never;
      const svc = new RppsVerificationService(
        createConfig({ ESANTE_API_KEY: 'k', RPPS_REQUIRE_PSYCHOLOGIST: 'false' }),
      );
      const r = await svc.verify('10100092010');
      expect(r.status).toBe('verified');
    });

    it('api_unavailable : HTTP 500 → non bloquant', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as never;
      const svc = new RppsVerificationService(createConfig({ ESANTE_API_KEY: 'k' }));
      const r = await svc.verify('10100092010');
      expect(r.status).toBe('api_unavailable');
      expect(r.blocking).toBe(false);
    });

    it('api_unavailable : fetch rejette (réseau) → non bloquant', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as never;
      const svc = new RppsVerificationService(createConfig({ ESANTE_API_KEY: 'k' }));
      const r = await svc.verify('10100092010');
      expect(r.status).toBe('api_unavailable');
      expect(r.blocking).toBe(false);
    });
  });
});
