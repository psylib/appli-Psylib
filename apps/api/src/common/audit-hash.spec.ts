import {
  canonicalize,
  computeAuditHash,
  verifyAuditChain,
  type AuditHashInput,
  type AuditChainRow,
} from './audit-hash';

/** Construit une chaîne valide de N entrées (hash chaînés). */
function buildChain(n: number): AuditChainRow[] {
  const rows: AuditChainRow[] = [];
  let prevHash: string | null = null;
  for (let i = 0; i < n; i++) {
    const base: AuditHashInput = {
      actorId: `user-${i}`,
      actorType: 'psychologist',
      action: 'READ',
      entityType: 'patient',
      entityId: `p-${i}`,
      ipAddress: '203.0.113.1',
      metadata: { i },
      createdAt: new Date(Date.UTC(2026, 5, 27, 10, 0, i)),
      prevHash,
    };
    const hash = computeAuditHash(base);
    rows.push({ ...base, id: `row-${i}`, hash });
    prevHash = hash;
  }
  return rows;
}

const BASE: AuditHashInput = {
  actorId: 'user-1',
  actorType: 'psychologist',
  action: 'DECRYPT',
  entityType: 'session',
  entityId: 'sess-1',
  ipAddress: '203.0.113.7',
  metadata: { field: 'notes' },
  createdAt: new Date('2026-06-27T10:00:00.000Z'),
  prevHash: null,
};

describe('canonicalize — sérialisation déterministe', () => {
  it('trie les clés → indépendant de l’ordre d’insertion', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
  });

  it('trie récursivement les objets imbriqués', () => {
    expect(canonicalize({ x: { d: 1, c: 2 } })).toBe(canonicalize({ x: { c: 2, d: 1 } }));
  });

  it('distingue des valeurs différentes', () => {
    expect(canonicalize({ a: 1 })).not.toBe(canonicalize({ a: 2 }));
  });

  it('gère null et tableaux', () => {
    expect(canonicalize(null)).toBe('null');
    expect(canonicalize([3, 1, 2])).toBe('[3,1,2]');
  });
});

describe('computeAuditHash — hash chaîné', () => {
  it('est déterministe (même entrée → même hash)', () => {
    expect(computeAuditHash(BASE)).toBe(computeAuditHash(BASE));
  });

  it('produit un SHA-256 hex (64 caractères)', () => {
    expect(computeAuditHash(BASE)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('change si un champ de contenu change', () => {
    expect(computeAuditHash(BASE)).not.toBe(
      computeAuditHash({ ...BASE, action: 'READ' }),
    );
    expect(computeAuditHash(BASE)).not.toBe(
      computeAuditHash({ ...BASE, entityId: 'sess-2' }),
    );
  });

  it('change si le prevHash change (chaînage effectif)', () => {
    expect(computeAuditHash(BASE)).not.toBe(
      computeAuditHash({ ...BASE, prevHash: 'a'.repeat(64) }),
    );
  });

  it('insensible à l’ordre des clés de metadata', () => {
    const h1 = computeAuditHash({ ...BASE, metadata: { a: 1, b: 2 } });
    const h2 = computeAuditHash({ ...BASE, metadata: { b: 2, a: 1 } });
    expect(h1).toBe(h2);
  });

  it('traite Date et ISO string de façon équivalente', () => {
    const h1 = computeAuditHash({ ...BASE, createdAt: new Date('2026-06-27T10:00:00.000Z') });
    const h2 = computeAuditHash({ ...BASE, createdAt: '2026-06-27T10:00:00.000Z' });
    expect(h1).toBe(h2);
  });

  it('traite actorId/ipAddress/metadata null sans planter et de façon stable', () => {
    const input: AuditHashInput = {
      ...BASE,
      actorId: null,
      ipAddress: null,
      metadata: null,
    };
    expect(computeAuditHash(input)).toMatch(/^[0-9a-f]{64}$/);
    expect(computeAuditHash(input)).toBe(computeAuditHash(input));
  });
});

describe('verifyAuditChain — détection d’altération', () => {
  it('valide une chaîne intègre', () => {
    expect(verifyAuditChain(buildChain(5))).toEqual({ valid: true, checked: 5 });
  });

  it('valide une chaîne vide', () => {
    expect(verifyAuditChain([])).toEqual({ valid: true, checked: 0 });
  });

  it('détecte une altération de contenu (hash-mismatch)', () => {
    const chain = buildChain(5);
    // On modifie le contenu d'une entrée SANS recalculer son hash (= falsification)
    chain[2] = { ...chain[2], action: 'DELETE' };
    const v = verifyAuditChain(chain);
    expect(v.valid).toBe(false);
    expect(v.brokenAt).toEqual({ id: 'row-2', reason: 'hash-mismatch' });
    expect(v.checked).toBe(2);
  });

  it('détecte une suppression d’entrée (broken-link)', () => {
    const chain = buildChain(5);
    chain.splice(2, 1); // supprime le 3e maillon
    const v = verifyAuditChain(chain);
    expect(v.valid).toBe(false);
    expect(v.brokenAt?.reason).toBe('broken-link');
    expect(v.checked).toBe(2);
  });

  it('détecte une genèse falsifiée (prevHash non nul en tête)', () => {
    const chain = buildChain(3);
    chain[0] = { ...chain[0], prevHash: 'f'.repeat(64) };
    expect(verifyAuditChain(chain).valid).toBe(false);
  });
});
